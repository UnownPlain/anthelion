import { matchAndValidate } from '../src/validate.ts';
import ky from 'ky';

export default async function () {
	const versionInfo = await ky('https://www.stunnel.org/downloads.html').text();
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
