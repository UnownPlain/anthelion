import { pageMatch } from '../src/helpers.ts';

export default async function () {
	const version = await pageMatch(
		'https://www.gethomebank.org/en/downloads.php',
		/href="[^"]*HomeBank[._-](\d+(?:\.\d+)+)[._-]setup\.exe"/i,
	);
	const urls = [
		`https://www.gethomebank.org/public/binaries/HomeBank-${version}-setup.exe`,
	];

	return {
		version,
		urls,
	};
}
