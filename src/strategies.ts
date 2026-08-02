import { parseYaml } from '@unownplain/anthelion-komac';
import ky from 'ky';

import { compareVersions, getPath, match, parseString } from '@/helpers.ts';

export type MatchStrategyOptions = {
	url: string;
	regex: string | RegExp;
};

export type VersionStrategyResult = {
	version: string;
};

function toRegExp(regex: string | RegExp) {
	return typeof regex === 'string' ? new RegExp(regex, 'i') : regex;
}

export async function electronBuilder(options: { url: string }): Promise<VersionStrategyResult> {
	const response = await ky(options.url).text();
	// This is set to failsafe so incorrectly quoted values aren't parsed as numbers
	const data = parseYaml(response, 'failsafe');
	return { version: parseString(getPath(data, 'version')) };
}

export async function pageMatch(options: MatchStrategyOptions) {
	const page = await ky(options.url).text();
	const { groups, captures } = match(
		page,
		toRegExp(options.regex),
		'Failed to extract version from page',
	);
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
				toRegExp(options.regex),
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

function findLatestVersion(value: string, pattern: string | RegExp) {
	const regex = toRegExp(pattern);
	const globalRegex = regex.global ? regex : new RegExp(regex.source, `${regex.flags}g`);
	const matches = value.matchAll(globalRegex);
	const versions = Array.from(matches, (match) => parseString(match[1]));
	versions.sort((a, b) => compareVersions(b, a));
	return versions[0];
}

export async function sortVersions(options: MatchStrategyOptions): Promise<VersionStrategyResult> {
	const page = await ky(options.url).text();
	const version = findLatestVersion(page, options.regex);
	if (!version) {
		throw new Error('Failed to extract version from page');
	}
	return { version };
}

export async function sourceforge(options: {
	project: string;
	file?: string;
}): Promise<VersionStrategyResult> {
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
