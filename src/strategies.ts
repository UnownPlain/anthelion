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

export async function redirectMatch(options: MatchStrategyOptions & { method?: 'head' | 'get' }) {
	const response = await ky(options.url, {
		method: options.method ?? 'head',
		redirect: 'manual',
		throwHttpErrors: false,
	});

	const redirect = response.headers.get('location');
	if (!redirect) {
		throw new Error('No redirect location found');
	}
	const version = match(redirect, toRegExp(options.regex), 'Failed to extract version from URL')
		.groups[0];

	return {
		version,
		url: redirect,
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
