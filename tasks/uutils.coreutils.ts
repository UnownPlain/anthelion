import { getLatestRelease } from '../src/github.ts';

export default async function () {
	const version = await getLatestRelease('uutils', 'coreutils');
	const urls = [
		`https://github.com/uutils/coreutils/releases/download/${version}{/coreutils-${version}{-i686-pc-windows-msvc.zip`,
		`https://github.com/uutils/coreutils/releases/download/${version}{/coreutils-${version}{-x86_64-pc-windows-msvc.zip`,
		`https://github.com/uutils/coreutils/releases/download/${version}{/coreutils-${version}{-aarch64-pc-windows-msvc.zip`,
	];

	return {
		version,
		urls,
	};
}
