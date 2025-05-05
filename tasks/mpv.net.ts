import { getLatestRelease } from '../src/github.ts';
import { updatePackage } from '../src/komac.ts';

export default async function () {
	const version = await getLatestRelease('mpvnet-player', 'mpv.net');

	const urls = [
		`https://github.com/mpvnet-player/mpv.net/releases/download/v${version}/mpv.net-v${version}-setup.exe`,
	];

	await updatePackage('mpv.net', version, urls);
}
