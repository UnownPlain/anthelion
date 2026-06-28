import { getLatestRelease } from '@/github.ts';
import { defineShard } from '@/schema/script-shard.ts';

export default defineShard(async () => {
	const { version, urls } = await getLatestRelease({
		owner: 'YACReader',
		repo: 'yacreader',
	});

	return {
		version,
		urls: () => urls().filter((url) => url.includes('qt')),
	};
});
