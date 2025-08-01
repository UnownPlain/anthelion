import { pageMatch } from '../src/helpers.ts';

export default async function () {
	const version = await pageMatch(
		'https://bitcoincore.org/en/download/',
		/href=.*?bitcoin[._-]core[._-](\d+(?:\.\d+)+)\/bitcoin[._-](\d+(?:\.\d+)+)[._-]win64[._-]setup\.exe/i,
	);
	const urls = [
		`https://bitcoincore.org/bin/bitcoin-core-${version}/bitcoin-${version}-win64-setup.exe`,
	];

	return {
		version,
		urls,
	};
}
