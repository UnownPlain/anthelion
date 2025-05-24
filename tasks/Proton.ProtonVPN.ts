import { validateString } from '../src/validate.ts';

export default async function () {
	const response = await fetch(
		'https://protonvpn.com/download/windows/x64/v1/version.json',
	);
	const versionInfo = await response.json();
	const versions = versionInfo.Releases.filter(
		// @ts-ignore .
		(version) => version.CategoryName === 'Stable',
	);

	const version = validateString(versions[0].Version);
	const urls = [
		`https://vpn.protondownload.com/download/ProtonVPN_v${version}_x64.exe`,
		`https://vpn.protondownload.com/download/ProtonVPN_v${version}_arm64.exe`,
	];

	return {
		packageId: 'Proton.ProtonVPN',
		version,
		urls,
	};
}
