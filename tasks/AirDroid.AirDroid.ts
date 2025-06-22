import { matchAndValidate } from '../src/validate.ts';
import ky from 'ky';

export default async function () {
	const response = await ky(
		'https://srv3.airdroid.com/p20/web/getbinaryredirect?type=exe&channel=&version=',
		{
			redirect: 'manual',
			throwHttpErrors: false,
		},
	);
	const redirect = response.headers.get('location');
	if (!redirect) {
		throw new Error('No redirect location found');
	}

	const regex = /AirDroid_Desktop_Client_(?<Version>[\d\.]+)\.exe/i;

	const version = matchAndValidate(redirect, regex)[1];
	const urls = [redirect];

	return {
		version,
		urls,
	};
}
