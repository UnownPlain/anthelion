import { matchAndValidate } from '../src/validate.ts';
import ky from 'ky';

export default async function () {
	const versionInfo = await ky(
		'https://www.gethomebank.org/en/downloads.php',
	).text();
	const regex = /href="[^"]*HomeBank[._-](\d+(?:\.\d+)+)[._-]setup\.exe"/i;

	const version = matchAndValidate(versionInfo, regex)[1];
	const urls = [
		`https://www.gethomebank.org/public/binaries/HomeBank-${version}-setup.exe`,
	];

	return {
		version,
		urls,
	};
}
