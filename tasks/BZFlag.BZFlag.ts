import { sortSemver } from '../src/helpers.ts';
import { validateString } from '../src/validate.ts';

import ky from 'ky';

export default async function () {
	const versionInfo = await ky(
		'https://download.bzflag.org/bzflag/windows/',
	).text();
	const regex = /href=["']?v?(\d+(?:\.\d+)+)\/?["' >]/gi;
	const matches = versionInfo.matchAll(regex);
	const versions = sortSemver(Array.from(matches, (match) => match[1]));

	const version = validateString(versions[0]);
	const urls = [
		`https://download.bzflag.org/bzflag/windows/${version}/bzflag-${version}.exe`,
	];

	return {
		version,
		urls,
	};
}
