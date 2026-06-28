import ky from 'ky';

import { match } from '@/helpers.ts';
import { defineShard } from '@/schema/script-shard.ts';

export default defineShard(async () => {
	const releases = await ky('https://downloads.zohocdn.com/arattai-desktop/artifacts.json').json<{
		windows: { '32bit': string; '64bit': string };
	}>();

	const urls = () => [releases.windows['32bit'], releases.windows['64bit']];
	const [version] = match(
		releases.windows['64bit'],
		/Arattai[._-]v?(\d+(?:\.\d+)+)(?:[._-]x\d+)?\.exe/i,
	);
	return {
		version,
		urls,
	};
});
