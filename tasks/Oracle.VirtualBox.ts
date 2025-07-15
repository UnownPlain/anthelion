import { matchAndValidate } from '../src/validate.ts';
import ky from 'ky';

export default async function () {
	const versionInfo = await ky(
		'https://www.virtualbox.org/wiki/Downloads',
	).text();
	const regex =
		/href=.*?VirtualBox[._-]v?(\d+(?:\.\d+)+)[._-](\d+)[._-]Win\.exe/i;

	const match = matchAndValidate(versionInfo, regex);
	const version = match[1];
	const version2 = match[2];
	const urls = [
		`https://download.virtualbox.org/virtualbox/${version}/VirtualBox-${version}-${version2}-Win.exe|x64`,
	];

	return {
		version,
		urls,
	};
}
