import ky from 'ky';

export default async function () {
	const response = await ky.head('https://download.sysinternals.com/files/DebugView.zip');
	const state = response.headers.get('Etag');

	if (!state) {
		throw new Error('No ETag found');
	}

	return {
		version: () => 'productVersion',
		installerMatches: ['Dbgview.exe'],
		urls: () => ['https://download.sysinternals.com/files/DebugView.zip'],
		replace: true,
		state,
	};
}
