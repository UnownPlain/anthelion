import { updatePackage } from '../src/komac.ts';
import { validateMatch } from '../src/validate.ts';

export default async function () {
	const versionInfo = await fetch('https://www.torproject.org/download/').then(
		(res) => res.text(),
	);

	const match = versionInfo.match(
		/href=.*?tor-browser-windows-x86_64-portable[._-]v?(\d+(?:\.\d+)+)\.exe/i,
	);

	const version = validateMatch(match)[1];
	const urls = [
		`https://archive.torproject.org/tor-package-archive/torbrowser/${version}/tor-browser-windows-i686-portable-${version}.exe`,
		`https://archive.torproject.org/tor-package-archive/torbrowser/${version}/tor-browser-windows-x86_64-portable-${version}.exe`,
	];

	await updatePackage(
		'TorProject.TorBrowser',
		version,
		urls,
		'--release-notes-url',
		'https://blog.torproject.org/category/releases/',
	);
}
