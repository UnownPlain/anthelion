import ky from 'ky';

import { defineShard } from '@/schema/script-shard.ts';

export default defineShard(async () => {
	const releases = await ky('https://proton.me/download/meet/windows/version.json').json<{
		Releases: Array<{ CategoryName: string; Version: string }>;
	}>();
	const versions = releases.Releases.filter((version) => version.CategoryName === 'Stable');

	const version = versions[0]?.Version;
	const urls = () => [`https://proton.me/download/meet/windows/${version}/ProtonMeet-desktop.exe`];

	return {
		version,
		urls,
	};
});
