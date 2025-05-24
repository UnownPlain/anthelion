import { validateString } from '../src/validate.ts';

export default async function () {
	const response = await fetch(
		'https://download.svc.ui.com/v1/software-downloads',
	);
	const versionInfo = await response.json();
	const versions = versionInfo.downloads.filter(
		// @ts-ignore .
		(version) => version.platform === 'windows',
	);

	const version = validateString(versions[0].version);
	const urls = [`https://dl.ui.com/unifi/${version}/UniFi-installer.exe`];

	return {
		packageId: 'Ubiquiti.UniFiNetworkServer',
		version,
		urls,
	};
}
