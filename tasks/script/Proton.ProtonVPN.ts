import ky from 'ky';

export default async function () {
	const releases = await ky(
		'https://protonvpn.com/download/windows/x64/v1/version.json',
	).json<{ Releases: Array<{ Version: string; CategoryName: string }> }>();
	const versions = releases.Releases.filter(
		(version) => version.CategoryName === 'Stable',
	);

	const version = versions[0]?.Version;
	const urls = [
		`https://vpn.protondownload.com/download/ProtonVPN_v${version}_x64.exe`,
		`https://vpn.protondownload.com/download/ProtonVPN_v${version}_arm64.exe`,
	];

	return {
		version,
		urls,
	};
}
