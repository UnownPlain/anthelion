import { getLatestReleaseFromRedirect } from '@/github.ts';
import { defineShard } from '@/schema/script-shard.ts';

export default defineShard(async () => {
	const release = await getLatestReleaseFromRedirect({
		owner: 'duplicati',
		repo: 'duplicati',
	});

	const version = release.tag.split('_')[0];
	const urls = () => [
		`https://github.com/duplicati/duplicati/releases/download/${release.rawTag}/duplicati-${release.tag}-win-x86-gui.msi`,
		`https://github.com/duplicati/duplicati/releases/download/${release.rawTag}/duplicati-${release.tag}-win-x64-gui.msi`,
		`https://github.com/duplicati/duplicati/releases/download/${release.rawTag}/duplicati-${release.tag}-win-arm64-gui.msi`,
	];

	return {
		version,
		urls,
	};
});
