import { pageMatch } from '../src/helpers.ts';

export default async function () {
	const version = await pageMatch(
		'https://certifytheweb.com/',
		/certifythewebsetup[._-]v?(\d+(?:\.\d+)+)\.exe/i,
	);
	const urls = [
		`https://downloads.certifytheweb.com/CertifyTheWebSetup_V${version}.exe`,
	];

	return {
		version,
		urls,
	};
}
