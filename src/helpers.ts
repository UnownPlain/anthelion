import { parse as parseYaml } from '@std/yaml';
import { matchAndValidate, validateString } from './validate.ts';
import { compare, parse as parseSemver } from '@std/semver';
import ky from 'ky';

export async function electronBuilder(url: string) {
	const response = await ky(url).text();
	const data = parseYaml(response) as { version: unknown };
	return validateString(data.version);
}

export async function pageMatch(url: string, regex: RegExp) {
	const versionInfo = await ky(url).text();
	return matchAndValidate(versionInfo, regex)[1];
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

	return {
		version: matchAndValidate(redirect, regex)[1],
		url: redirect,
	};
}

export function sortSemver(versions: string[]) {
	return versions.sort((a, b) => compare(parseSemver(b), parseSemver(a)));
}
