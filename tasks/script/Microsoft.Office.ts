import ky from 'ky';

export default async function () {
	const response = await ky.head(
		'https://officecdn.microsoft.com/DSDownloadAPI/Download.ashx/dscdn/officecapes/wsus/setup.exe',
	);
	const state = response.headers.get('Etag');

	if (!state) {
		throw new Error('No ETag found');
	}

	return {
		version: 'productVersion',
		urls: ['https://officecdn.microsoft.com/pr/wsus/setup.exe'],
		state,
	};
}
