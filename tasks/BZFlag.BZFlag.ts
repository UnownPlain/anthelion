import { sortSemver } from '../src/helpers.ts';
import { updatePackage } from '../src/komac.ts';
import { validateString } from '../src/validate.ts';

export default async function () {
	const versionInfo = await fetch(
		'https://download.bzflag.org/bzflag/windows/',
	).then((res) => res.text());

	const matches = versionInfo.matchAll(
		/href=["']?v?(\d+(?:\.\d+)+)\/?["' >]/gi,
	);
	const versions = sortSemver(Array.from(matches, (match) => match[1]));
	const version = validateString(versions[0]);

	const urls = [
		`https://download.bzflag.org/bzflag/windows/${version}/bzflag-${version}.exe`,
	];

	await updatePackage('BZFlag.BZFlag', version, urls);
}
