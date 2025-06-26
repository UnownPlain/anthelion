import { pageMatch } from '../src/helpers.ts';

export default async function () {
	const version = await pageMatch(
		'https://www.klayout.de/build.html',
		/href="https:\/\/www\.klayout\.org\/downloads\/Windows\/klayout[._-](\d+(?:\.\d+)+)[._-]win(?:32|64)[._-]install\.exe"/i,
	);
	const urls = [
		`https://www.klayout.org/downloads/Windows/klayout-${version}-win64-install.exe`,
		`https://www.klayout.org/downloads/Windows/klayout-${version}-win32-install.exe`,
	];

	return {
		version,
		urls,
	};
}
