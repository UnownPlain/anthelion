import { matchAndValidate } from '../src/validate.ts';

export default async function () {
	const response = await fetch(
		'https://steelseries.com/gg/downloads/gg/latest/windows',
		{
			redirect: 'manual',
		},
	);
	const redirect = response.headers.get('location');
	if (!redirect) {
		throw new Error('No redirect location found');
	}

	const regex = /SteelSeriesGG(?<Version>[\d\.]+)Setup.exe/i;

	const version = matchAndValidate(redirect, regex)[1];
	const urls = [redirect];

	return {
		version,
		urls,
	};
}
