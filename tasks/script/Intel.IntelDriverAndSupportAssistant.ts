import ky from 'ky';

export default async function () {
	const response = await ky.head('https://dsadata.intel.com/installer');
	const state = response.headers.get('Last-Modified');

	if (!state) {
		throw new Error('No Last-Modified header found');
	}

	return {
		version: 'displayVersion',
		urls: () => ['https://dsadata.intel.com/installer'],
		state,
	};
}
