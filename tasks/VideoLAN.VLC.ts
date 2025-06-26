import { pageMatch } from '../src/helpers.ts';

export default async function () {
	const version = await pageMatch(
		'https://www.videolan.org/vlc/download-windows.html',
		/vlc\/([\d\.]+)\/win(?:32|64)\/vlc-[\d\.]+-win(?:32|64)\.exe/,
	);
	const urls = [
		`https://download.videolan.org/videolan/vlc/${version}/win64/vlc-${version}-win64.exe`,
		`https://download.videolan.org/videolan/vlc/${version}/win32/vlc-${version}-win32.exe`,
	];

	return {
		version,
		urls,
	};
}
