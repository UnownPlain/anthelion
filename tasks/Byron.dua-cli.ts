import { getLatestRelease } from '../src/github.ts';

export default async function () {
	const version = await getLatestRelease('Byron', 'dua-cli');
	const urls = [
		`https://github.com/Byron/dua-cli/releases/download/v${version}/dua-v${version}-x86_64-pc-windows-msvc.zip`,
		`https://github.com/Byron/dua-cli/releases/download/v${version}/dua-v${version}-i686-pc-windows-msvc.zip`,
	];

	return {
		version,
		urls,
	};
}
