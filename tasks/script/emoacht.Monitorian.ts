import { getLatestVersion } from '@/github.ts';

export default async function () {
	const { version: tag } = await getLatestVersion({
		owner: 'emoacht',
		repo: 'Monitorian',
	});

	const version = tag.replace('-Installer', '');
	const urls = [
		`https://github.com/emoacht/Monitorian/releases/download/${version}-Installer/MonitorianInstaller${version.replaceAll('.', '')}.zip`,
	];

	return {
		version,
		urls,
	};
}
