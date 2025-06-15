import { matchAndValidate } from '../src/validate.ts';

export default async function () {
	const response = await fetch('https://www.virtualbox.org/wiki/Downloads');
	const versionInfo = await response.text();
	const regex =
		/href=.*?VirtualBox[._-]v?(\d+(?:\.\d+)+)[._-](\d+)[._-]Win\.exe/i;

	const match = matchAndValidate(versionInfo, regex);
	const version = match[1];
	const version2 = match[2];
	const urls = [
		`https://download.virtualbox.org/virtualbox/${version}/VirtualBox-${version}-${version2}-Win.exe`,
	];

	return {
		version,
		urls,
	};
}
