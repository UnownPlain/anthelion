import ky from 'ky';

import { match } from '@/helpers.ts';

export default async function () {
	const response = await ky(
		'https://grafana.com/grafana/download?edition=enterprise&platform=windows',
	).text();
	const [url, version] = match(
		response,
		/(https:\/\/dl\.grafana\.com\/grafana-enterprise\/release\/(\d+(?:\.\d+)+)\/grafana-enterprise_[^"' >]+?_windows_amd64\.msi)/i,
	);

	return {
		version,
		urls: [url],
	};
}
