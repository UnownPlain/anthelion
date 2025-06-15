import { matchAndValidate } from '../src/validate.ts';

export default async function () {
	const response = await fetch(
		'https://www.videolan.org/vlc/download-windows.html',
	);
	const versionInfo = await response.text();
	const regex = /vlc\/([\d\.]+)\/win(?:32|64)\/vlc-[\d\.]+-win(?:32|64)\.exe/;

	const version = matchAndValidate(versionInfo, regex)[1];
	const urls = [
		`https://download.videolan.org/videolan/vlc/${version}/win64/vlc-${version}-win64.exe`,
		`https://download.videolan.org/videolan/vlc/${version}/win32/vlc-${version}-win32.exe`,
	];

	return {
		version,
		urls,
	};
}
