import { pageMatch } from '../src/helpers.ts';

export default async function () {
	const version = await pageMatch(
		'https://www.torproject.org/download/',
		/href=.*?tor-browser-windows-x86_64-portable[._-]v?(\d+(?:\.\d+)+)\.exe/i,
	);
	const urls = [
		`https://archive.torproject.org/tor-package-archive/torbrowser/${version}/tor-browser-windows-i686-portable-${version}.exe`,
		`https://archive.torproject.org/tor-package-archive/torbrowser/${version}/tor-browser-windows-x86_64-portable-${version}.exe`,
	];

	return {
		version,
		urls,
		args: [
			'--release-notes-url',
			'https://blog.torproject.org/category/releases/',
		],
	};
}
