import { redirectMatch } from '../src/helpers.ts';

export default async function () {
	const { version, url } = await redirectMatch(
		'https://steelseries.com/gg/downloads/gg/latest/windows',
		/SteelSeriesGG(?<Version>[\d\.]+)Setup.exe/i,
	);

	return {
		version,
		urls: [url],
	};
}
