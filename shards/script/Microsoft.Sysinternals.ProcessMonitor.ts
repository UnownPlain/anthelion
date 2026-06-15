import ky from 'ky';

export default async function () {
	const response = await ky.head('https://download.sysinternals.com/files/ProcessMonitor.zip');
	const state = response.headers.get('Etag');

	if (!state) {
		throw new Error('No ETag found');
	}

	return {
		version: () => 'productVersion',
		installerMatches: ['Procmon.exe'],
		urls: () => ['https://download.sysinternals.com/files/ProcessMonitor.zip'],
		replace: true,
		state,
	};
}
