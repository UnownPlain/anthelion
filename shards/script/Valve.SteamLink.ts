import { analyzeInstaller } from '@unownplain/anthelion-komac';
import ky from 'ky';

import { defineShard } from '@/schema/script-shard.ts';

export default defineShard(async () => {
	const response = await ky.head(
		'https://media.steampowered.com/steamlink/windows/latest/SteamLink.zip',
	);
	const state = response.headers.get('ETag');

	if (!state) {
		throw new Error('No ETag found');
	}

	const version = () => 'displayVersion';
	const urls = async () => {
		const result = await analyzeInstaller(
			'https://media.steampowered.com/steamlink/windows/latest/SteamLink.zip',
			['SteamLink.msi'],
		);
		return [
			`https://media.steampowered.com/steamlink/windows/SteamLink-${result.analysis[0]?.appsAndFeaturesEntries[0]?.displayVersion}.zip|x86`,
		];
	};

	return {
		version,
		urls,
		installerMatches: ['SteamLink.msi'],
		state,
	};
});
