import { getAllReleases } from '@/github.ts';

export default async function () {
	const releases = await getAllReleases('duplicati', 'duplicati', true);
	const release = releases.filter((release) => release.tag_name.includes('beta'))[0];

	const tag = release?.tag_name.slice(1);
	const version = tag?.split('_')[0];
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
