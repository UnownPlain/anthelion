import ky from 'ky';

import { match } from '@/helpers.ts';

export default async function () {
	const response = await ky('https://developer.android.com/studio/').text();
	const [url, version] = match(
		response,
		/studio_win_bundle_download[\s\S]+?href="(https:\/\/edgedl\.me\.gvt1\.com\/android\/studio\/install\/(\d+(?:\.\d+)+)\/android-studio-[^"]*windows\.exe)"/i,
	);

	return {
		version,
		urls: [`${url}|x64`],
		releaseNotesUrl: 'https://androidstudio.googleblog.com/',
	};
}
