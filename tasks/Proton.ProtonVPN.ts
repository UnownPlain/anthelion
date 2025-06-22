import { validateString } from '../src/validate.ts';
import ky from 'ky';

export default async function () {
	const versionInfo = (await ky(
		'https://protonvpn.com/download/windows/x64/v1/version.json',
	).json()) as { Releases: Array<{ Version: string; CategoryName: string }> };
	const versions = versionInfo.Releases.filter(
		(version) => version.CategoryName === 'Stable',
	);

	const version = validateString(versions[0].Version);
	const urls = [
		`https://vpn.protondownload.com/download/ProtonVPN_v${version}_x64.exe`,
		`https://vpn.protondownload.com/download/ProtonVPN_v${version}_arm64.exe`,
	];

	return {
		version,
		urls,
	};
}
