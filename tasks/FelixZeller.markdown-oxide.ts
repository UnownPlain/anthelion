import { getLatestRelease } from '../src/github.ts';

export default async function () {
	const version = await getLatestRelease('Feel-ix-343', 'markdown-oxide');
	const urls = [
		`https://github.com/Feel-ix-343/markdown-oxide/releases/download/v${version}/markdown-oxide-v${version}-x86_64-pc-windows-gnu.zip`,
	];

	return {
		version,
		urls,
	};
}
