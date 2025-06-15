import { matchAndValidate } from '../src/validate.ts';

export default async function () {
	const response = await fetch('https://www.gethomebank.org/en/downloads.php');
	const versionInfo = await response.text();
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
