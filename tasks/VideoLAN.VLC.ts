import { matchAndValidate } from '../src/validate.ts';
import ky from 'ky';

export default async function () {
	const versionInfo = await ky(
		'https://www.videolan.org/vlc/download-windows.html',
	).text();
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
