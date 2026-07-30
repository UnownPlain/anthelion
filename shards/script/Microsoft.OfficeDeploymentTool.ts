import { getPath } from '@/helpers.ts';
import { defineShard } from '@/schema/script-shard.ts';
import { pageMatch } from '@/strategies.ts';

export default defineShard(async () => {
	const { groups } = await pageMatch({
		url: 'https://www.microsoft.com/download/details.aspx?id=49117',
		regex: /<script>window\.__DLCDetails__=(\{.+?\})<\/script>/is,
	});
	const details = JSON.parse(groups[0]);

	const version = getPath(details, 'dlcDetailsView.downloadFile.0.version');
	const url = getPath(details, 'dlcDetailsView.downloadFile.0.url');

	return {
		version,
		urls: () => [url],
	};
});
