import { matchAndValidate } from '../src/validate.ts';
import ky from 'ky';

export default async function () {
	const versionInfo = await ky('https://www.klayout.de/build.html').text();
	const regex =
		/href="https:\/\/www\.klayout\.org\/downloads\/Windows\/klayout[._-](\d+(?:\.\d+)+)[._-]win(?:32|64)[._-]install\.exe"/i;

	const version = matchAndValidate(versionInfo, regex)[1];
	const urls = [
		`https://www.klayout.org/downloads/Windows/klayout-${version}-win64-install.exe`,
		`https://www.klayout.org/downloads/Windows/klayout-${version}-win32-install.exe`,
	];

	return {
		version,
		urls,
	};
}
