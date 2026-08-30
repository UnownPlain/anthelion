import { parseYaml } from '@unownplain/anthelion-komac';
import ky from 'ky';
import { z } from 'zod';

import { compareVersions, match, parseString } from '@/helpers.ts';

export type MatchStrategyOptions = {
	url: string;
	regex: RegExp;
};

const electronBuilderUpdateSchema = z.object({
	version: z.string().min(1),
	files: z.array(z.object({ url: z.string().min(1) })).optional(),
	path: z.string().min(1).optional(),
});

export async function electronBuilder(options: { url: string }) {
	const initialResponse = await ky(options.url, {
		redirect: 'manual',
		throwHttpErrors: false,
	});
	const location = initialResponse.headers.get('location');
	const feedUrl = location ? new URL(location, options.url).href : options.url;
	const response = location ? await ky(feedUrl) : initialResponse;
	// This is set to failsafe so incorrectly quoted values aren't parsed as numbers
	const data = electronBuilderUpdateSchema.parse(parseYaml(await response.text(), 'failsafe'));
	const paths = data.files?.length
		? data.files.map((file) => file.url)
		: data.path
			? [data.path]
			: [];

	if (paths.length === 0) {
		throw new Error('No URLs found in Electron Builder update');
	}

	const urls = Array.from(new Set(paths.map((path) => new URL(path, feedUrl).href)));

	return { version: parseString(data.version), urls };
}

const tauriUpdateSchema = z.object({
	version: z.string().min(1),
	platforms: z.record(z.string(), z.object({ url: z.url() })),
});

export async function tauri(options: { url: string; platforms?: string[] }) {
	const data = tauriUpdateSchema.parse(await ky(options.url).json());
	const platforms = options.platforms
		? options.platforms.map((platform) => {
				const update = data.platforms[platform];
				if (!update) {
					throw new Error(`Tauri update does not contain platform ${platform}`);
				}
				return update;
			})
		: Object.entries(data.platforms)
				.filter(([platform]) => platform.toLowerCase().startsWith('windows-'))
				.map(([, update]) => update);
	const urls = Array.from(new Set(platforms.map((platform) => platform.url)));

	if (urls.length === 0) {
		throw new Error('No Windows URLs found in Tauri update');
	}

	return { version: parseString(data.version), urls, data };
}

const toDesktopUpdateSchema = z.object({
	version: z.string().min(1),
	artifacts: z.record(z.string(), z.unknown()),
});

function collectUrls(value: unknown): string[] {
	if (!value || typeof value !== 'object') return [];

	const record = value as Record<string, unknown>;
	const url = record.url;
	if (typeof url === 'string' && z.url().safeParse(url).success) return [url];

	return Object.values(record).flatMap((entry) => collectUrls(entry));
}

export async function toDesktop(options: { appId: string }) {
	const data = toDesktopUpdateSchema.parse(
		await ky(
			`https://download.todesktop.com/${encodeURIComponent(options.appId)}/td-latest.json`,
		).json(),
	);
	const urls = Array.from(new Set(collectUrls(data.artifacts)));

	if (urls.length === 0) {
		throw new Error('No URLs found in ToDesktop update');
	}

	return { version: parseString(data.version), urls, data };
}

const msDownloadCenterDetailsSchema = z.object({
	dlcDetailsView: z.object({
		downloadFile: z.array(
			z.object({
				name: z.string(),
				url: z.url(),
				version: z.string().min(1),
			}),
		),
	}),
});

export async function msDownloadCenter(options: { id: number; regex?: RegExp }) {
	const page = await ky(`https://www.microsoft.com/download/details.aspx?id=${options.id}`).text();
	const detailsMatch = page.match(/<script>window\.__DLCDetails__=(\{.+?\})<\/script>/is);
	if (!detailsMatch?.[1]) {
		throw new Error('Failed to extract Microsoft Download Center details');
	}

	const data = msDownloadCenterDetailsSchema.parse(JSON.parse(detailsMatch[1]));
	const regex = options.regex;
	const files = regex
		? data.dlcDetailsView.downloadFile.filter((file) => {
				regex.lastIndex = 0;
				return regex.test(file.name);
			})
		: data.dlcDetailsView.downloadFile;

	if (files.length === 0) {
		throw new Error('No matching files found in Microsoft Download Center details');
	}

	const versions = new Set(files.map((file) => parseString(file.version)));
	if (versions.size !== 1) {
		throw new Error('Microsoft Download Center files have different versions');
	}

	return {
		version: parseString(files[0]?.version),
		urls: files.map((file) => file.url),
		data,
	};
}

export async function pageMatch(options: MatchStrategyOptions) {
	const page = await ky(options.url).text();
	const { groups, captures } = match(page, options.regex, 'Failed to extract version from page');
	const version = captures.version ?? groups[0];

	return {
		version: parseString(version),
		groups,
		captures,
	};
}

export async function redirectMatch(
	options: Omit<MatchStrategyOptions, 'url'> & {
		url: string[];
		method?: 'head' | 'get';
	},
) {
	const results = await Promise.all(
		options.url.map(async (url) => {
			const response = await ky(url, {
				method: options.method ?? 'get',
				redirect: 'manual',
				throwHttpErrors: false,
			});

			const redirect = response.headers.get('location');
			if (!redirect) {
				throw new Error(`No redirect location found for ${url}`);
			}

			const { groups, captures } = match(
				redirect,
				options.regex,
				'Failed to extract version from URL',
			);
			const version = captures.version ?? groups[0];
			return { version: parseString(version), url: redirect, captures };
		}),
	);
	const firstResult = results[0];
	if (!firstResult) {
		throw new Error('At least one redirect URL is required');
	}

	if (results.some((result) => result.version !== firstResult.version)) {
		throw new Error('Redirect URLs resolved to different versions');
	}

	return {
		version: firstResult.version,
		urls: results.map((result) => result.url),
		captures: firstResult.captures,
	};
}

function findLatestVersion(value: string, regex: RegExp) {
	const globalRegex = regex.global ? regex : new RegExp(regex.source, `${regex.flags}g`);
	const matches = value.matchAll(globalRegex);
	const versions = Array.from(matches, (match) => parseString(match[1]));
	versions.sort((a, b) => compareVersions(b, a));
	return versions[0];
}

export async function sortVersions(options: MatchStrategyOptions) {
	const page = await ky(options.url).text();
	const version = findLatestVersion(page, options.regex);
	if (!version) {
		throw new Error('Failed to extract version from page');
	}
	return { version };
}

export async function sourceforge(options: { project: string; file?: string }) {
	const SOURCEFORGE_VERSION_REGEX = '(\\d+(?:[-.]\\d+)+)';
	const feedUrl = `https://sourceforge.net/projects/${options.project}/rss`;

	const regex = options.file
		? new RegExp(
				`url=.*?/${RegExp.escape(options.project)}/files/.*?/${RegExp.escape(options.file).replace('\\{version\\}', SOURCEFORGE_VERSION_REGEX)}`,
				'i',
			)
		: new RegExp(
				`url=.*?/${RegExp.escape(options.project)}/files/.*?[-_/]${SOURCEFORGE_VERSION_REGEX}[-_/%.]`,
				'i',
			);

	const page = await ky(feedUrl).text();
	const version = findLatestVersion(page, regex);
	if (!version) {
		throw new Error('Failed to extract version from SourceForge feed');
	}
	return { version };
}
