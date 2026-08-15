import ky from 'ky';

import { komac } from '@/helpers';
import { defineShard } from '@/schema/script-shard.ts';

export default defineShard(async () => {
	const { versions } = await komac.analyzeInstaller({
		url: 'https://github.com/jank2/ListenToMe/releases/latest/download/ListenToMe_Setup.exe',
	});
	const response = await ky(
		'https://github.com/jank2/ListenToMe/releases/latest/download/ListenToMe.exe',
		{
			redirect: 'manual',
			throwHttpErrors: false,
		},
	);

	return {
		version: versions.product,
		urls: () => [response.headers.get('location')],
	};
});
