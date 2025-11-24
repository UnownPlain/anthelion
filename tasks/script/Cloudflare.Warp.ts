import { vs } from '@/helpers.ts';
import ky from 'ky';

export default async function () {
	const response = await ky(
		'https://downloads.cloudflareclient.com/v1/update/json/windows/ga',
	).json<{ items: Array<{ version: string; releaseDate: string }> }>();

	const version = response.items[0]?.version;
	const urls = [`https://downloads.cloudflareclient.com/v1/download/windows/version/${version}`];

	return {
		version: version?.substring(2),
		urls,
		args: [
			'--release-notes-url',
			`https://developers.cloudflare.com/cloudflare-one/changelog/warp/#${vs(response.items[0]?.releaseDate.split('T')[0])}`,
		],
	};
}
