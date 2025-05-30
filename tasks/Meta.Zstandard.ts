import { getLatestRelease } from '../src/github.ts';

export default async function () {
	const version = await getLatestRelease('facebook', 'zstd');
	const urls = [
		`https://github.com/facebook/zstd/releases/download/v${version}/zstd-v${version}-win32.zip`,
		`https://github.com/facebook/zstd/releases/download/v${version}/zstd-v${version}-win64.zip`,
	];

	return {
		version,
		urls,
	};
}
