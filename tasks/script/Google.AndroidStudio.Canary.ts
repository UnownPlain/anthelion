import ky from 'ky';

import { match } from '@/helpers.ts';

export default async function () {
	const response = await ky('https://developer.android.com/studio/preview/').text();
	const [url, version] = match(
		response,
		/canary_win_bundle_download[\s\S]+?href="(https:\/\/edgedl\.me\.gvt1\.com\/android\/studio\/install\/(\d+(?:\.\d+)+)\/android-studio-[^"]*windows\.exe)"/i,
	);

	return {
		version,
		urls: [`${url}|x64`],
		args: ['--release-notes-url', 'https://androidstudio.googleblog.com/'],
	};
}
