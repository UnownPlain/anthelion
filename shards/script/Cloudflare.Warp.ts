import ky from 'ky';

import { ReleaseNotesSource } from '@/schema/release-notes.ts';
import { defineShard } from '@/schema/script-shard.ts';

export default defineShard(async () => {
	const response = await ky(
		'https://downloads.cloudflareclient.com/v1/update/json/windows/ga',
	).json<{
		items: Array<{
			version: string;
			releaseDate: string;
			releaseNotes: string;
			packageURL: string;
		}>;
	}>();

	const version = response.items[0]?.version;
	const urls = () => [response.items[0]?.packageURL];

	return {
		version: version?.substring(2),
		urls,
		releaseNotes: {
			source: ReleaseNotesSource.Json,
			nestedSource: ReleaseNotesSource.Markdown,
			sourceUrl: `https://downloads.cloudflareclient.com/v1/update/json/windows/ga`,
			path: 'items.0.releaseNotes',
			releaseNotesUrl: `https://developers.cloudflare.com/cloudflare-one/changelog/warp/#${response.items[0]?.releaseDate.split('T')[0]}`,
		},
	};
});
