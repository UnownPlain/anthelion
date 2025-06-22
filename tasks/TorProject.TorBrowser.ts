import { matchAndValidate } from '../src/validate.ts';
import ky from 'ky';

export default async function () {
	const versionInfo = await ky('https://www.torproject.org/download/').text();
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
