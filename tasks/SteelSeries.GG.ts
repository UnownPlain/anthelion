import { validateMatch } from '../src/validate.ts';

export default async function () {
	const response = await fetch(
		'https://steelseries.com/gg/downloads/gg/latest/windows',
		{
			redirect: 'manual',
		},
	);
	const redirect = response.headers.get('location');
	// @ts-ignore .
	const match = redirect.match(/SteelSeriesGG(?<Version>[\d\.]+)Setup.exe/i);

	const version = validateMatch(match)[1];
	const urls = [redirect];

	return {
		version,
		urls,
	};
}
