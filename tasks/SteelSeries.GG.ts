import { matchAndValidate } from '../src/validate.ts';
import ky from 'ky';

export default async function () {
	const response = await ky(
		'https://steelseries.com/gg/downloads/gg/latest/windows',
		{
			redirect: 'manual',
			throwHttpErrors: false,
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
