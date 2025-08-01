import { pageMatch } from '../src/helpers.ts';

export default async function () {
	const version = await pageMatch(
		'https://electrum.org/#download',
		/href=.*?electrum[._-](\d+(?:\.\d+)+)[._-]setup\.exe/i,
	);
	const urls = [
		`https://download.electrum.org/${version}/electrum-${version}-setup.exe`,
	];

	return {
		version,
		urls,
	};
}
