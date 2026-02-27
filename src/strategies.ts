import ky from 'ky';
import { parse } from 'yaml';

import { compareVersions, match, vs } from '@/helpers.ts';

export async function electronBuilder(url: string) {
	const response = await ky(url).text();
	// This is set to failsafe so incorrectly quoted values aren't parsed as numbers
	const data = parse(response, { schema: 'failsafe' });
	return vs(data.version);
}

export async function pageMatch(url: string, regex: RegExp) {
	const page = await ky(url).text();
	const version = match(page, regex)[0];
	if (!version) {
		throw new Error('Failed to extract version from page');
	}
	return version;
}

export async function redirectMatch(url: string, regex: RegExp) {
	const response = await ky(url, {
		redirect: 'manual',
		throwHttpErrors: false,
	});

	const redirect = response.headers.get('location');
	if (!redirect) {
		throw new Error('No redirect location found');
	}
	const version = match(redirect, regex)[0];
	if (!version) {
		throw new Error('Failed to extract version from URL');
	}

	return {
		version,
		url: redirect,
	};
}

export function sortVersions(str: string, regex: RegExp) {
	const globalRegex = regex.global ? regex : new RegExp(regex.source, `${regex.flags}g`);
	const matches = str.matchAll(globalRegex);
	const versions = Array.from(matches, (match) => vs(match[1]));
	versions.sort((a, b) => compareVersions(b, a));
	return versions[0];
}

export async function sourceforge(projectName: string, fileName?: string) {
	const feedUrl = `https://sourceforge.net/projects/${projectName}/rss`;
	const escapedProjectName = RegExp.escape(projectName);
	const defaultRegex = fileName
		? new RegExp(
				`url=.*?/${escapedProjectName}/files/.*?/${RegExp.escape(fileName).replace('\\{version\\}', '(\\d+(?:[-.]\\d+)+)')}`,
				'i',
			)
		: new RegExp(`url=.*?/${escapedProjectName}/files/.*?[-_/](\\d+(?:[-.]\\d+)+)[-_/%.]`, 'i');

	const page = await ky(feedUrl).text();
	const version = sortVersions(page, defaultRegex);
	if (!version) {
		throw new Error('Failed to extract version from SourceForge feed');
	}
	return version;
}
