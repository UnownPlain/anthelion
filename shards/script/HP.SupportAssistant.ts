import ky from 'ky';

import { match } from '@/helpers';
import { defineShard } from '@/schema/script-shard';

export default defineShard(async () => {
	const response = await ky('https://hpsa-redirectors.hpcloud.hp.com/common/hpsaredirector.js', {
		headers: { Accept: '*/*' },
	}).text();

	const {
		groups: [range, softpaq, version],
	} = match(
		response,
		/catch \(e\) \{ \}\s+return getProtocol\(\) \+ "ftp\.hp\.com\/pub\/softpaq\/(?<range>sp\d+-\d+)\/(?<softpaq>sp\d+)\.exe";\s*\/\/(?<version>\d+(?:\.\d+)+)/i,
	);
	const urls = () => [`https://ftp.hp.com/pub/softpaq/${range}/${softpaq}.exe`];

	return {
		version,
		urls,
	};
});
