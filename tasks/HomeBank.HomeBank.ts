import { validateMatch } from '../src/validate.ts';

export default async function () {
	const response = await fetch('https://www.gethomebank.org/en/downloads.php');
	const versionInfo = await response.text();
	const match = versionInfo.match(
		/href="[^"]*HomeBank[._-](\d+(?:\.\d+)+)[._-]setup\.exe"/i,
	);

	const version = validateMatch(match)[1];
	const urls = [
		`https://www.gethomebank.org/public/binaries/HomeBank-${version}-setup.exe`,
	];

	return {
		version,
		urls,
	};
}
