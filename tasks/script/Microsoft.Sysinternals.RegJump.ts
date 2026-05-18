import ky from 'ky';

export default async function () {
	const response = await ky.head('https://download.sysinternals.com/files/RegJump.zip');
	const state = response.headers.get('Etag');

	if (!state) {
		throw new Error('No ETag found');
	}

	return {
		version: () => 'productVersion',
		installerMatches: ['regjump.exe'],
		urls: () => ['https://download.sysinternals.com/files/RegJump.zip'],
		replace: true,
		state,
	};
}
