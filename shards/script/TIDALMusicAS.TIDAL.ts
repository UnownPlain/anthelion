import ky from 'ky';

export default async function () {
	const installerUrl = 'https://download.tidal.com/desktop/TIDALSetup.exe';
	const response = await ky.head(installerUrl);
	const state = response.headers.get('ETag');

	if (!state) {
		throw new Error('No ETag found');
	}

	return {
		version: () => 'productVersion',
		urls: () => [installerUrl],
		replace: true,
		state,
	};
}
