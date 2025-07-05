import { redirectMatch } from '../src/helpers.ts';

export default async function () {
	const { version, url } = await redirectMatch(
		'https://cdn1.waterfox.net/waterfox/releases/latest/windows',
		/Waterfox[._-]Setup[._-](\d+(?:\.\d+)+)\.exe/i,
	);

	return {
		version,
		urls: [url],
	};
}
