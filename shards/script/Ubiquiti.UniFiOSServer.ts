import ky from 'ky';

import { defineShard } from '@/schema/script-shard.ts';

export default defineShard(async () => {
	const releases = await ky('https://download.svc.ui.com/v1/software-downloads').json<{
		downloads: { name: string; platform: string; version: string; file_url: string }[];
	}>();
	const versions = releases.downloads
		.filter((version) => version.platform === 'windows' && version.name.includes('UniFi OS Server'))
		.slice(0, 2);

	const version = versions[0]?.version;
	const urls = () =>
		versions.map((version) => {
			return version.file_url;
		});

	return {
		version,
		urls,
	};
});
