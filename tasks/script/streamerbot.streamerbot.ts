import { vs } from '@/helpers.ts';
import ky from 'ky';

export default async function () {
	const releases = await ky(
		'https://streamer.bot/api/releases/streamer.bot',
	).json<{ stable: { version: string; url: string } }>();

	const version = vs(releases.stable.version);
	const urls = [vs(releases.stable.url)];

	return {
		version,
		urls,
	};
}
