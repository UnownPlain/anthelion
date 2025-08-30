import { Temporal } from '@js-temporal/polyfill';
import { getAllReleases } from '@/github.ts';
import { matchAndValidate, vs } from '@/helpers.ts';

export default async function () {
	const releases = await getAllReleases('yt-dlp', 'FFmpeg-Builds');
	let date = Temporal.Now.plainDateISO('UTC')
		.with({ day: 1 })
		.subtract({ days: 1 });
	let release;

	for (let i = 0; i < 15; i++) {
		release = releases.find((release) =>
			release.tag_name.includes(date.toString()),
		);

		if (release) {
			break;
		}

		date = date.subtract({ days: 1 });
	}

	if (!release) {
		throw new Error('No release found in the last 15 days');
	}

	const urls = release.assets
		.filter(
			(asset) =>
				asset.name.includes('win') &&
				asset.name.includes('shared') &&
				asset.name.includes('ffmpeg-N'),
		)
		.map((asset) => {
			const url = asset.browser_download_url;
			return url.includes('arm64') ? `${url}|arm64` : url;
		});
	const version = matchAndValidate(
		vs(urls[0]),
		/ffmpeg-N-(\d+-g[a-f0-9]+)-win\d*-gpl(?:-shared)?\.zip/i,
	)[1];

	return {
		version: `N-${version}-${date.toString().replaceAll('-', '')}`,
		urls,
	};
}
