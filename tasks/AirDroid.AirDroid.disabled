import { validateMatch } from '../src/validate.ts';

export default async function () {
	const response = await fetch(
		'https://srv3.airdroid.com/p20/web/getbinaryredirect?type=exe&channel=&version=',
		{
			redirect: 'manual',
		},
	);
	const redirect = response.headers.get('location');
	// @ts-ignore .
	const match = redirect.match(
		/AirDroid_Desktop_Client_(?<Version>[\d\.]+)\.exe/i,
	);

	const version = validateMatch(match)[1];
	const urls = [redirect];

	return {
		version,
		urls,
	};
}
