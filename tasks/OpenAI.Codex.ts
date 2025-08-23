import { getLatestRelease } from '../src/github.ts';

export default async function () {
	const version = (await getLatestRelease('openai', 'codex')).replace(
		'rust-v',
		'',
	);
	const urls = [
		`https://github.com/openai/codex/releases/download/rust-v${version}/codex-x86_64-pc-windows-msvc.exe.zip`,
	];

	return {
		version,
		urls,
	};
}
