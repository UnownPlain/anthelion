import { defineShard } from '@/schema/script-shard.ts';
import { pageMatch } from '@/strategies.ts';

export default defineShard(async () => {
	const {
		groups: [x64, version, x86],
	} = await pageMatch({
		url: 'https://www.apachelounge.com/download/',
		regex: /href=["'](\/download\/[^"' >]*httpd-([\d.]+)-\d+-(?:win32|win64)-vs\d+\.zip)["']/i,
	});
	const urls = () => [`https://www.apachelounge.com${x64}`, `https://www.apachelounge.com${x86}`];

	return {
		version,
		urls,
	};
});
