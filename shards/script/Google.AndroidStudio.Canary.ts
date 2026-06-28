import ky from 'ky';

import { match } from '@/helpers.ts';
import { defineShard } from '@/schema/script-shard.ts';

export default defineShard(async () => {
	const response = await ky('https://developer.android.com/studio/preview/').text();
	const [url, version] = match(
		response,
		/canary_win_bundle_download[\s\S]+?href="(https:\/\/edgedl\.me\.gvt1\.com\/android\/studio\/install\/(\d+(?:\.\d+)+)\/android-studio-[^"]*windows\.exe)"/i,
	);

	return {
		version,
		urls: () => [`${url}|x64`],
		releaseNotes: {
			releaseNotesUrl: 'https://androidstudio.googleblog.com/',
		},
	};
});
