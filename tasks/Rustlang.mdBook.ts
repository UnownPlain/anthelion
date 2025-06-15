import { getLatestRelease } from '../src/github.ts';

export default async function () {
	const version = await getLatestRelease('rust-lang', 'mdBook');
	const urls = [
		`https://github.com/rust-lang/mdBook/releases/download/v${version}/mdbook-v${version}-x86_64-pc-windows-msvc.zip`,
	];

	return {
		version,
		urls,
	};
}
