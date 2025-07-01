import { redirectMatch } from '../src/helpers.ts';

export default async function () {
	const { version, url } = await redirectMatch(
		'https://x.raycast-releases.com/download/web?platform=windows&architecture=x64',
		/Raycast\.Package[._-](\d+(?:\.\d+)+)(?:[._-]\w+)?[._-]x64\.msix/i,
	);

	return {
		version,
		urls: [url],
	};
}
