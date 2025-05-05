import { updatePackage } from '../src/komac.ts';
import { validateString } from '../src/validate.ts';

export default async function () {
	const versionInfo = await fetch(
		'https://protonvpn.com/download/windows/x64/v1/version.json',
	).then((res) => res.json());

	const versions = versionInfo.Releases.filter(
		// @ts-ignore .
		(version) => version.CategoryName === 'Stable',
	);

	const version = validateString(versions[0].Version);
	const urls = [
		`https://vpn.protondownload.com/download/ProtonVPN_v${version}_x64.exe`,
		`https://vpn.protondownload.com/download/ProtonVPN_v${version}_arm64.exe`,
	];

	await updatePackage('Proton.ProtonVPN', version, urls);
}
