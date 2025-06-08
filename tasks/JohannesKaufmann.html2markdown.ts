import { getLatestRelease } from '../src/github.ts';

export default async function () {
	const version = await getLatestRelease(
		'JohannesKaufmann',
		'html-to-markdown',
	);
	const urls = [
		`https://github.com/JohannesKaufmann/html-to-markdown/releases/download/v${version}/html-to-markdown_Windows_i386.zip`,
		`https://github.com/JohannesKaufmann/html-to-markdown/releases/download/v${version}/html-to-markdown_Windows_x86_64.zip`,
		`https://github.com/JohannesKaufmann/html-to-markdown/releases/download/v${version}/html-to-markdown_Windows_arm64.zip`,
	];

	return {
		version,
		urls,
	};
}
