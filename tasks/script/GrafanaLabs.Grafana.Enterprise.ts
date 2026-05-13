import ky from 'ky';

import { match } from '@/helpers.ts';

export default async function () {
	const response = await ky(
		'https://grafana.com/grafana/download?edition=enterprise&platform=windows',
	).text();
	const [url, upstreamVersion] = match(
		response,
		/(https:\/\/dl\.grafana\.com\/grafana-enterprise\/release\/(\d+(?:\.\d+)+(?:\+security-\d+)?)\/grafana-enterprise_[^"' >]+?_windows_amd64\.msi)/i,
	);

	const version = upstreamVersion?.replace(/\+security-(\d+)$/i, '.$1');

	return {
		version,
		urls: () => [url],
	};
}
