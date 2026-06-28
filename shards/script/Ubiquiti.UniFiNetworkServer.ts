import ky from 'ky';

import { defineShard } from '@/schema/script-shard.ts';

export default defineShard(async () => {
	const releases = await ky('https://download.svc.ui.com/v1/software-downloads').json<{
		downloads: { name: string; platform: string; version: string }[];
	}>();
	const versions = releases.downloads.filter(
		(version) =>
			version.platform === 'windows' && version.name.includes('UniFi Network Application'),
	);

	const version = versions[0]?.version;
	const urls = () => [`https://dl.ui.com/unifi/${version}/UniFi-installer.exe|x64`];

	return {
		version,
		urls,
	};
});
