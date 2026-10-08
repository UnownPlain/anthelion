import ky from 'ky';

import { match } from '@/helpers';
import { defineShard } from '@/schema/script-shard.ts';

export default defineShard(async () => {
	const release = await ky
		.post('https://licensing.emclient.com/api/Release/get-head-version-url', {
			json: {
				applicationName: 'eM Client',
				guid: '',
				hwGuid: '00000000-0000-0000-0000-000000000000',
				version: '0.0.0.0',
			},
		})
		.json<{ url: string }>();
	const {
		groups: [version],
	} = match(release.url, /^https:\/\/www\.emclient\.com\/dist\/v(\d+(?:\.\d+)+)\/setup\.msi$/i);

	return {
		version,
		urls: () => [release.url, `https://cdn-dist.emclient.com/dist/v${version}/setup.msixbundle`],
	};
});
