import ky from 'ky';

import { defineShard } from '@/schema/script-shard.ts';

export default defineShard(async () => {
	const release = await ky(
		'https://things.seriflabs.com/affinity-update-windows-retail-studiopro-x64-packaged',
	).json<{
		version: string;
		uri: string;
	}>();

	const version = release.version;
	const urls = () => [release.uri, release.uri.replace('x64', 'arm64')];

	return {
		version,
		urls,
	};
});
