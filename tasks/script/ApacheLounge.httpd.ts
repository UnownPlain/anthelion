import { match } from '@/helpers.ts';
import ky from 'ky';

export default async function () {
	const versionInfo = await ky('https://www.apachelounge.com/download/').text();
	const [version, date] = match(
		versionInfo,
		/httpd-([\d.]+)-(\d+)-(?:win32|win64)-vs\d+\.zip/i,
	);
	const urls = [
		`https://www.apachelounge.com/download/VS17/binaries/httpd-${version}-${date}-Win64-VS17.zip`,
		`https://www.apachelounge.com/download/vs17/binaries/httpd-${version}-${date}-win32-vs17.zip`,
	];

	return {
		version,
		urls,
	};
}
