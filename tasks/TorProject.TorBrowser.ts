import { matchAndValidate } from '../src/validate.ts';

export default async function () {
	const response = await fetch('https://www.torproject.org/download/');
	const versionInfo = await response.text();
	const regex =
		/href=.*?tor-browser-windows-x86_64-portable[._-]v?(\d+(?:\.\d+)+)\.exe/i;

	const version = matchAndValidate(versionInfo, regex)[1];
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
