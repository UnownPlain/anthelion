import ky from 'ky';
import { YAML } from 'bun';
import { matchAndValidate, vs } from '@/helpers.ts';

export async function electronBuilder(url: string) {
	const response = await ky(url).text();
	const data = YAML.parse(response) as { version: unknown };
	return vs(data.version);
}

export async function pageMatch(url: string, regex: RegExp): Promise<string> {
	const page = await ky(url).text();
	const match = matchAndValidate(page, regex);
	const version = match[1];
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
	const version = matchAndValidate(redirect, regex)[1];
	if (!version) {
		throw new Error('Failed to extract version from URL');
	}

	return {
		version,
		url: redirect,
	};
}
