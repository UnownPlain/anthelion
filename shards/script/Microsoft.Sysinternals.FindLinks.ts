import ky from 'ky';

export default async function () {
	const response = await ky.head('https://download.sysinternals.com/files/FindLinks.zip');
	const state = response.headers.get('Etag');

	if (!state) {
		throw new Error('No ETag found');
	}

	return {
		version: () => 'productVersion',
		installerMatches: ['FindLinks.exe'],
		urls: () => ['https://download.sysinternals.com/files/FindLinks.zip'],
		replace: true,
		state,
	};
}
