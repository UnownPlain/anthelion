import { analyzeInstaller } from '@unownplain/anthelion-komac';
import ky from 'ky';

import { defineShard } from '@/schema/script-shard.ts';

export default defineShard(async () => {
	const { productVersion: version } = await analyzeInstaller(
		'https://github.com/jank2/ListenToMe/releases/latest/download/ListenToMe_Setup.exe',
	);
	const response = await ky(
		'https://github.com/jank2/ListenToMe/releases/latest/download/ListenToMe.exe',
		{
			redirect: 'manual',
			throwHttpErrors: false,
		},
	);

	return {
		version,
		urls: () => [response.headers.get('location')],
	};
});
