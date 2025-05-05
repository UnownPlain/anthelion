import { updatePackage } from '../src/komac.ts';
import { validateMatch } from '../src/validate.ts';

export default async function () {
	const versionInfo = await fetch(
		'https://www.videolan.org/vlc/download-windows.html',
	).then((res) => res.text());

	const match = versionInfo.match(
		/vlc\/([\d\.]+)\/win(?:32|64)\/vlc-[\d\.]+-win(?:32|64)\.exe/,
	);
	const version = validateMatch(match)[1];

	const urls = [
		`https://download.videolan.org/videolan/vlc/${version}/win64/vlc-${version}-win64.exe`,
		`https://download.videolan.org/videolan/vlc/${version}/win32/vlc-${version}-win32.exe`,
	];

	await updatePackage('VideoLAN.VLC', version, urls);
}
