import ky from 'ky';

import { match } from '@/helpers.ts';

export default async function () {
	const response = await ky('https://www.virtualbox.org/wiki/Downloads').text();
	const regex = /href=.*?VirtualBox[._-]v?(\d+(?:\.\d+)+)[._-](\d+)[._-]Win\.exe/i;

	const [version, version2] = match(response, regex);
	const urls = [
		`https://download.virtualbox.org/virtualbox/${version}/VirtualBox-${version}-${version2}-Win.exe|x64`,
	];

	return {
		version,
		urls,
	};
}
