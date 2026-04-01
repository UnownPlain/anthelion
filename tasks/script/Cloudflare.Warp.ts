import ky from 'ky';

import { vs } from '@/helpers.ts';

export default async function () {
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
	const urls = [response.items[0]?.packageURL];

	return {
		version: version?.substring(2),
		urls,
		releaseNotes: {
			source: 'json',
			sourceUrl: `https://downloads.cloudflareclient.com/v1/update/json/windows/ga`,
			path: 'items.0.releaseNotes',
			releaseNotesUrl: `https://developers.cloudflare.com/cloudflare-one/changelog/warp/#${vs(response.items[0]?.releaseDate.split('T')[0])}`,
			cleanup: true,
		},
	};
}
