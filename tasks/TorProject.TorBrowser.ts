import { validateMatch } from '../src/validate.ts';

export default async function () {
	const response = await fetch('https://www.torproject.org/download/');
	const versionInfo = await response.text();
	const match = versionInfo.match(
		/href=.*?tor-browser-windows-x86_64-portable[._-]v?(\d+(?:\.\d+)+)\.exe/i,
	);

	const version = validateMatch(match)[1];
	const urls = [
		`https://archive.torproject.org/tor-package-archive/torbrowser/${version}/tor-browser-windows-i686-portable-${version}.exe`,
		`https://archive.torproject.org/tor-package-archive/torbrowser/${version}/tor-browser-windows-x86_64-portable-${version}.exe`,
	];

	return {
		packageId: 'TorProject.TorBrowser',
		version,
		urls,
		args: [
			'--release-notes-url',
			'https://blog.torproject.org/category/releases/',
		],
	};
}
