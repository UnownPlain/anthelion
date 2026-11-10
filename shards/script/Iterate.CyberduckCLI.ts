import { getLatestRelease } from '@/github.ts';
import { match } from '@/helpers.ts';
import { defineShard } from '@/schema/script-shard.ts';

export default defineShard(async () => {
	const release = await getLatestRelease({
		owner: 'iterate-ch',
		repo: 'cyberduck',
		useLatestEndpoint: true,
		assetRegex: '^duck-\\d+(?:\\.\\d+){3}-(?:x64|arm64)\\.msi$',
	});

	const {
		groups: [version],
	} = match(release.urls()[0], /\/duck-(\d+(?:\.\d+){3})-/i);
	const urls = release.urls;

	return {
		version,
		urls,
	};
});
