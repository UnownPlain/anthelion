import { getLatestRelease } from '../src/github.ts';

export default async function () {
	const version = await getLatestRelease('syncthing', 'syncthing');
	const urls = [
		`https://github.com/syncthing/syncthing/releases/download/v${version}/syncthing-windows-386-v${version}.zip`,
		`https://github.com/syncthing/syncthing/releases/download/v${version}/syncthing-windows-amd64-v${version}.zip`,
		`https://github.com/syncthing/syncthing/releases/download/v${version}/syncthing-windows-arm-v${version}.zip`,
		`https://github.com/syncthing/syncthing/releases/download/v${version}/syncthing-windows-arm64-v${version}.zip`,
	];

	return {
		packageId: 'Syncthing.Syncthing',
		version,
		urls,
	};
}
