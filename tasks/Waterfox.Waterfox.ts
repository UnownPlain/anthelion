import { redirectMatch } from '../src/helpers.ts';

export default async function () {
	const { version, url } = await redirectMatch(
		'https://cdn1.waterfox.net/waterfox/releases/latest/windows',
		/Waterfox\s+Setup\s+(\d+(?:\.\d+)+)\.exe/i,
	);

	return {
		version,
		urls: [url],
	};
}
