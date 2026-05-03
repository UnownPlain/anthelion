import { Temporal } from 'temporal-polyfill';

import { getLatestRelease } from '@/github.ts';
import { match } from '@/helpers.ts';

export default async function () {
	const date = Temporal.Now.plainDateISO().add({ days: 1 }).with({ day: 1 }).subtract({ days: 1 });
	const release = await getLatestRelease({
		owner: 'yt-dlp',
		repo: 'FFmpeg-Builds',
		tagIncludes: date.toString(),
	});

	const urls = () =>
		release
			.urls()
			.filter((url) => url.includes('win') && !url.includes('shared') && url.includes('ffmpeg-N'))
			.map((url) => {
				return url.includes('arm64') ? `${url}|arm64` : url;
			});
	const asset = release
		.assetNames()
		.find((name) => name.includes('win') && !name.includes('shared') && name.includes('ffmpeg-N'));
	const [version] = match(asset, /ffmpeg-N-(\d+-g[a-f0-9]+)-win\d*-gpl(?:-shared)?\.zip/i);

	return {
		version: `N-${version}-${date.toString().replaceAll('-', '')}`,
		urls,
	};
}
