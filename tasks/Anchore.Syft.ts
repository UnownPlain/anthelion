import { getLatestRelease } from '../src/github.ts';

export default async function () {
	const version = await getLatestRelease('anchore', 'syft');
	const urls = [
		`https://github.com/anchore/syft/releases/download/v${version}/syft_${version}_windows_amd64.zip`,
	];

	return {
		version,
		urls,
	};
}
