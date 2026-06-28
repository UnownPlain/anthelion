import ky from 'ky';

import { match } from '@/helpers.ts';
import { defineShard } from '@/schema/script-shard.ts';

export default defineShard(async () => {
	const response = await ky('https://app.8bitdo.com/').text();
	const [url, version] = match(
		response,
		/href="(https:\/\/support\.8bitdo\.com\/bd-uploads\/files\/\d{4}-\d{2}\/8BitDo[._-]Ultimate[._-]Software[._-]V2[._-]Windows[._-]V(\d+(?:\.\d+)+)\.zip)"/i,
	);

	return {
		version,
		urls: () => [`${url}|x64`],
	};
});
