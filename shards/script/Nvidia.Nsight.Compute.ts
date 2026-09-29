import ky from 'ky';

import { defineShard } from '@/schema/script-shard.ts';

export default defineShard(async () => {
	const { downloads } = await ky.get('https://developer.nvidia.com/tools-downloads.json').json<{
		downloads: {
			title: string;
			version: string;
			files: { url: string }[];
		}[];
	}>();
	const latest = downloads.filter((download) => download.title === 'Nsight Compute')[0]!;
	const installer = latest.files.find((file) =>
		/^https:\/\/developer\.nvidia\.com\/downloads\/assets\/tools\/secure\/nsight-compute\/[^/]+\/nsight_compute-windows-x86_64-\d+(?:\.\d+)+\.msi$/i.test(
			file.url,
		),
	);

	const version = latest.version;
	const urls = () => [installer!.url];

	return {
		version,
		urls,
	};
});
