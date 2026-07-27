import ky from 'ky';

import { komac } from '@/helpers';
import { defineShard } from '@/schema/script-shard.ts';

export default defineShard(async () => {
	const response = await ky.head(
		'https://media.steampowered.com/steamlink/windows/latest/SteamLink.zip',
	);
	const state = response.headers.get('ETag');

	if (!state) {
		throw new Error('No ETag found');
	}

	const version = { source: 'display' } as const;
	const urls = async () => {
		const result = await komac.analyzeInstaller({
			installer: {
				url: 'https://media.steampowered.com/steamlink/windows/latest/SteamLink.zip',
				nestedInstallerMatches: ['SteamLink.msi'],
			},
		});
		return [
			{
				url: `https://media.steampowered.com/steamlink/windows/SteamLink-${result.installers[0]?.appsAndFeaturesEntries[0]?.displayVersion}.zip`,
				architecture: 'x86',
				nestedInstallerMatches: ['SteamLink.msi'],
			},
		];
	};

	return {
		version,
		urls,
		state,
	};
});
