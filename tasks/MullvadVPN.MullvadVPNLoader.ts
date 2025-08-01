import { getAllReleases } from '../src/github.ts';

export default async function () {
	const versionInfo = await getAllReleases('mullvad', 'mullvadvpn-app');
	const version = versionInfo
		.filter((release) =>
			release.tag_name.startsWith('desktop/installer-downloader'),
		)[0]
		.tag_name.split('/')[2];
	const urls = [
		`https://github.com/mullvad/mullvadvpn-app/releases/download/desktop/installer-downloader/${version}/Install.Mullvad.VPN.exe`,
	];

	return {
		version,
		urls,
	};
}
