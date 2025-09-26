import { getLatestVersion } from '@/github.ts';

export default async function () {
	const tag = await getLatestVersion('emoacht', 'Monitorian');

	const version = tag.replace('-Installer', '');
	const urls = [
		`https://github.com/emoacht/Monitorian/releases/download/${version}-Installer/MonitorianInstaller${version.replaceAll('.', '')}.zip`,
	];

	return {
		version,
		urls,
	};
}
