import ky from 'ky';
import { parse } from 'yaml';
import z from 'zod';

import {
	closeAllButMostRecentPR,
	compareVersions,
	match,
	stateCompare,
	updateVersionState,
	vs,
} from '@/helpers.ts';
import { updatePackage } from '@/komac.ts';

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
	const matches = str.matchAll(regex);
	const versions = Array.from(matches, (match) => vs(match[1]));
	versions.sort((a, b) => compareVersions(b, a));
	return versions[0];
}

const versionStateStrategySchema = z.object({
	packageIdentifier: z.string(),
	newState: z.string().nullish().pipe(z.string()),
	version: z.string().nullish().pipe(z.string()),
	urls: z.array(z.string()),
	options: z.array(z.string()).optional(),
});

export async function versionStateStrategy(options: z.input<typeof versionStateStrategySchema>) {
	const {
		packageIdentifier,
		newState,
		version,
		urls,
		options: opts = [],
	} = versionStateStrategySchema.parse(options);

	if (await stateCompare(packageIdentifier, newState)) {
		return `Stored state matches latest state. (${version})\n`;
	}

	const output = await updatePackage(packageIdentifier, version, urls, ...opts);

	await updateVersionState(packageIdentifier, newState);
	await closeAllButMostRecentPR(packageIdentifier);

	return output;
}
