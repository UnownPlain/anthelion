import { defineShard } from '@/schema/script-shard.ts';
import { pageMatch } from '@/strategies.ts';

export default defineShard(async () => {
	const {
		groups: [url, upstreamVersion],
	} = await pageMatch({
		url: 'https://grafana.com/grafana/download?edition=enterprise&platform=windows',
		regex:
			/(https:\/\/dl\.grafana\.com\/grafana-enterprise\/release\/(\d+(?:\.\d+)+(?:\+security-\d+)?)\/grafana-enterprise_[^"' >]+?_windows_amd64\.msi)/i,
	});

	const version = upstreamVersion?.replace(/\+security-(\d+)$/i, '.$1');
	const urls = () => [url];

	return {
		version,
		urls,
	};
});
