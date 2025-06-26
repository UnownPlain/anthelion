import { validateString } from '../src/validate.ts';
import ky from 'ky';

export default async function () {
	const versionInfo = await ky(
		'https://download.svc.ui.com/v1/software-downloads',
	).json<{ downloads: { platform: string; version: string }[] }>();
	const versions = versionInfo.downloads.filter(
		(version) => version.platform === 'windows',
	);

	const version = validateString(versions[0].version);
	const urls = [`https://dl.ui.com/unifi/${version}/UniFi-installer.exe`];

	return {
		version,
		urls,
	};
}
