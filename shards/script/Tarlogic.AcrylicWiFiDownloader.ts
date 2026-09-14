import ky from 'ky';

import { match } from '@/helpers';
import { defineShard } from '@/schema/script-shard.ts';

export default defineShard(async () => {
	const url = 'https://www.acrylicwifi.com/AcrylicWifi/downloads/AcrylicDownload.php';

	const response = await ky(url);
	const contentDisposition = response.headers.get('content-disposition') || '';
	const {
		groups: [version],
	} = match(contentDisposition, /filename=AcrylicInstaller_(\d+(?:\.\d+)+)_Generic\.exe/i);

	return {
		version,
		urls: () => [url],
		replace: true,
	};
});
