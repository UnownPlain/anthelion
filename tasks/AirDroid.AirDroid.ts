import { redirectMatch } from '../src/helpers.ts';

export default async function () {
	const { version, url } = await redirectMatch(
		'https://srv3.airdroid.com/p20/web/getbinaryredirect?type=exe&channel=&version=',
		/AirDroid_Desktop_Client_(?<Version>[\d.]+)\.exe/i,
	);

	return {
		version,
		urls: [url],
	};
}
