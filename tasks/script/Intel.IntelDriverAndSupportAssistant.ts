import ky from 'ky';

export default async function () {
	const response = await ky.head('https://dsadata.intel.com/installer');
	const state = response.headers.get('X-DSA-Hash');

	if (!state) {
		throw new Error('No X-DSA-Hash header found');
	}

	return {
		version: 'displayVersion',
		urls: () => ['https://dsadata.intel.com/installer'],
		state,
	};
}
