import { getLatestVersion } from '@/github.ts';

export default async function () {
	const { version } = await getLatestVersion({
		owner: 'mullvad',
		repo: 'mullvadvpn-app',
		tagFilter: 'desktop/installer-downloader/',
	});
	const urls = [
		`https://github.com/mullvad/mullvadvpn-app/releases/download/desktop/installer-downloader/${version}/Install.Mullvad.VPN.exe`,
	];

	return {
		version,
		urls,
	};
}
