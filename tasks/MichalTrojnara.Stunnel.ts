import { pageMatch } from '../src/helpers.ts';

export default async function () {
	const version = await pageMatch(
		'https://www.stunnel.org/downloads.html',
		/href=.*?stunnel[._-]v?(\d+(?:\.\d+)+)\.t/i,
	);
	const urls = [
		`https://www.stunnel.org/downloads/stunnel-${version}-win64-installer.exe`,
	];

	return {
		version,
		urls,
	};
}
