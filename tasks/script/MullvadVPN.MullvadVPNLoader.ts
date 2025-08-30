import { getAllReleases } from '@/github.ts';
import { vs } from '@/helpers.ts';

export default async function () {
	const releases = await getAllReleases('mullvad', 'mullvadvpn-app');
	const release = releases.find((r) =>
		r.tag_name.startsWith('desktop/installer-downloader'),
	);

	const version = vs(release?.tag_name.split('/')[2]);
	const urls = [
		`https://github.com/mullvad/mullvadvpn-app/releases/download/desktop/installer-downloader/${version}/Install.Mullvad.VPN.exe`,
	];

	return {
		version,
		urls,
	};
}
