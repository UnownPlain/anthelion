import { updatePackage } from '../src/komac.ts';
import { validateString } from '../src/validate.ts';

export default async function () {
	const versionInfo = await fetch(
		'https://download.svc.ui.com/v1/software-downloads',
	).then((res) => res.json());

	const versions = versionInfo.downloads.filter(
		// @ts-ignore .
		(version) => version.platform === 'windows',
	);

	const version = validateString(versions[0].version);
	const urls = [`https://dl.ui.com/unifi/${version}/UniFi-installer.exe`];

	await updatePackage('Ubiquiti.UniFiNetworkServer', version, urls);
}
