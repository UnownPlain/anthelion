import { matchAndValidate } from '../src/validate.ts';

export default async function () {
	const response = await fetch('https://www.stunnel.org/downloads.html');
	const versionInfo = await response.text();
	const regex = /href=.*?stunnel[._-]v?(\d+(?:\.\d+)+)\.t/i;

	const version = matchAndValidate(versionInfo, regex)[1];
	const urls = [
		`https://www.stunnel.org/downloads/stunnel-${version}-win64-installer.exe`,
	];

	return {
		version,
		urls,
	};
}
