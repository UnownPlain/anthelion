import ky from 'ky';

import { match } from '@/helpers';
import { ReleaseNotesSource } from '@/schema/release-notes';
import { defineShard } from '@/schema/script-shard';

export default defineShard(async () => {
	const { results } = await ky('https://onlineservices.epicgames.com/api/cosmos/sdk').json<{
		results: {
			c_sharp: { archive_id: number; archive_type: string; version: string };
		};
	}>();
	const archive = results.c_sharp;
	const {
		groups: [version],
	} = match(archive.version, /^(\d+(?:\.\d+)+)-CL\d+$/i);

	return {
		version,
		urls: () => [
			`https://onlineservices.epicgames.com/api/cosmos/sdk/download?archive_id=${archive.archive_id}&archive_type=${archive.archive_type}`,
		],
		releaseNotes: {
			source: ReleaseNotesSource.BrowserRendering,
			sourceUrl: 'https://dev.epicgames.com/docs/epic-online-services/release-notes',
			waitUntil: 'networkidle2',
			characterLimit: 25000,
		},
	};
});
