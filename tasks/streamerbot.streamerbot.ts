import { validateString } from '../src/validate.ts';

export default async function () {
	const response = await fetch(
		'https://streamer.bot/api/releases/streamer.bot',
	);
	const versionInfo = await response.json();

	const version = validateString(versionInfo.stable.version);
	const urls = [validateString(versionInfo.stable.url)];

	return {
		version,
		urls,
	};
}
