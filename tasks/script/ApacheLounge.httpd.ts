import ky from 'ky';

import { match } from '@/helpers.ts';

export default async function () {
	const response = await ky('https://www.apachelounge.com/download/').text();
	const captures = match(
		response,
		/href=["'](\/download\/[^"' >]*httpd-([\d.]+)-\d+-(?:win32|win64)-vs\d+\.zip)["']/i,
	);

	const [x64, version, x86] = captures;
	const urls = [`https://www.apachelounge.com${x64}`, `https://www.apachelounge.com${x86}`];

	return {
		version,
		urls,
	};
}
