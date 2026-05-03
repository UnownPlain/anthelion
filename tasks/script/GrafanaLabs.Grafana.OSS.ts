import ky from 'ky';

import { match } from '@/helpers.ts';

export default async function () {
	const response = await ky(
		'https://grafana.com/grafana/download?edition=oss&platform=windows',
	).text();
	const [url, version] = match(
		response,
		/(https:\/\/dl\.grafana\.com\/grafana\/release\/(\d+(?:\.\d+)+)\/grafana_[^"' >]+?_windows_amd64\.msi)/i,
	);

	return {
		version,
		urls: () => [url],
	};
}
