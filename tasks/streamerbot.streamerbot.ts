import { validateString } from '../src/validate.ts';
import ky from 'ky';

export default async function () {
	const versionInfo = (await ky(
		'https://streamer.bot/api/releases/streamer.bot',
	).json()) as { stable: { version: string; url: string } };

	const version = validateString(versionInfo.stable.version);
	const urls = [validateString(versionInfo.stable.url)];

	return {
		version,
		urls,
	};
}
