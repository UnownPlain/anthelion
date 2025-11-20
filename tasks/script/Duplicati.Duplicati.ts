import { getLatestVersion } from '@/github.ts';

export default async function () {
	const { version: tag } = await getLatestVersion({
		owner: 'duplicati',
		repo: 'duplicati',
	});

	const version = tag.split('_')[0];
	const urls = [
		`https://github.com/duplicati/duplicati/releases/download/v${tag}/duplicati-${tag}-win-x86-gui.msi`,
		`https://github.com/duplicati/duplicati/releases/download/v${tag}/duplicati-${tag}-win-x64-gui.msi`,
		`https://github.com/duplicati/duplicati/releases/download/v${tag}/duplicati-${tag}-win-arm64-gui.msi`,
	];

	return {
		version,
		urls,
	};
}
