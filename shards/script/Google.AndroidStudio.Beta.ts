import ky from 'ky';

import { defineShard } from '@/schema/script-shard.ts';

export default defineShard(async () => {
	const releases = await ky('https://jb.gg/android-studio-releases-list.json').json<{
		content: {
			item: Array<{
				channel: string;
				version: string;
				download: Array<{ link: string }>;
			}>;
		};
	}>();
	const release = releases.content.item.find(({ channel }) => channel === 'RC');
	const url = release?.download.find(({ link }) => link.endsWith('-windows.exe'))?.link;

	return {
		version: release?.version,
		urls: () => [`${url}|x64`],
		releaseNotes: {
			releaseNotesUrl: 'https://androidstudio.googleblog.com/',
		},
	};
});
