import ky from 'ky';

import { match } from '@/helpers.ts';
import { defineShard } from '@/schema/script-shard.ts';

export default defineShard(async () => {
	const response = await ky(
		'https://grafana.com/grafana/download?edition=oss&platform=windows',
	).text();
	const [url, upstreamVersion] = match(
		response,
		/(https:\/\/dl\.grafana\.com\/grafana\/release\/(\d+(?:\.\d+)+(?:\+security-\d+)?)\/grafana_[^"' >]+?_windows_amd64\.msi)/i,
	);

	const version = upstreamVersion?.replace(/\+security-(\d+)$/i, '.$1');

	return {
		version,
		urls: () => [url],
	};
});
