import ky from 'ky';

import { match } from '@/helpers.ts';
import { defineShard } from '@/schema/script-shard.ts';

export default defineShard(async () => {
	const response = await ky('https://www.microsoft.com/download/details.aspx?id=49117').text();

	const [url, version] = match(
		response,
		/"url":"(https:\/\/download\.microsoft\.com\/download\/[^"]*?officedeploymenttool[^"]*?\.exe)","size":"[^"]+","version":"(\d+(?:\.\d+)+)"/i,
	);

	return {
		version,
		urls: () => [url],
	};
});
