import { Temporal } from 'temporal-polyfill';
import { getAllReleases } from '@/github.ts';
import { match, vs } from '@/helpers.ts';

export default async function () {
	const releases = await getAllReleases('yt-dlp', 'FFmpeg-Builds');
	const date = Temporal.Now.plainDateISO().add({ days: 1 }).with({ day: 1 }).subtract({ days: 1 });

	const release = releases.find((release) => release.tag_name.includes(date.toString()));

	if (!release) {
		throw new Error('Failed to find release. Upstream might not have published this version yet.');
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
	const [version] = match(vs(urls[0]), /ffmpeg-N-(\d+-g[a-f0-9]+)-win\d*-gpl(?:-shared)?\.zip/i);

	return {
		version: `N-${version}-${date.toString().replaceAll('-', '')}`,
		urls,
	};
}
