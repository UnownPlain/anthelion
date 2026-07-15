import ky from 'ky';

import { firstMatch, get } from '@/helpers.ts';
import { defineShard } from '@/schema/script-shard.ts';

export default defineShard(async () => {
	const response = await ky('https://www.microsoft.com/download/details.aspx?id=49117').text();

	const details = JSON.parse(
		firstMatch(response, /<script>window\.__DLCDetails__=(\{.+?\})<\/script>/is),
	);
	const version = get(details, 'dlcDetailsView.downloadFile.0.version');
	const url = get(details, 'dlcDetailsView.downloadFile.0.url');

	return {
		version,
		urls: () => [url],
	};
});
