import { getLatestRelease } from '@/github.ts';
import { defineShard } from '@/schema/script-shard.ts';

export default defineShard(async () => {
	const { version, urls: releaseUrls } = await getLatestRelease({
		owner: 'YACReader',
		repo: 'yacreader',
	});
	const urls = () => releaseUrls().filter((url) => url.includes('qt'));

	return {
		version,
		urls,
	};
});
