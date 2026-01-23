import ky from 'ky';

import { match } from '@/helpers.ts';

export default async function () {
	const versionInfo = await ky('https://www.apachelounge.com/download/').text();
	const [version, date] = match(versionInfo, /httpd-([\d.]+)-(\d+)-(?:win32|win64)-vs\d+\.zip/i);
	const urls = [
		`https://www.apachelounge.com/download/VS18/binaries/httpd-${version}-${date}-Win64-VS18.zip`,
		`https://www.apachelounge.com/download/vs18/binaries/httpd-${version}-${date}-win32-vs18.zip`,
	];

	return {
		version,
		urls,
	};
}
