import ky from 'ky';

import { sortVersions } from '@/strategies.ts';

export default async function () {
	const releases = await ky(
		'https://packages.broadcom.com/artifactory/saltproject-generic/windows/',
	).text();

	const version = sortVersions(releases, /href=["']?(\d+(?:\.\d+)*)\/?["' >]/gi);
	const urls = [
		`https://packages.broadcom.com/artifactory/saltproject-generic/windows/${version}/Salt-Minion-${version}-Py3-AMD64-Setup.exe`,
		`https://packages.broadcom.com/artifactory/saltproject-generic/windows/${version}/Salt-Minion-${version}-Py3-AMD64.msi`,
		`https://packages.broadcom.com/artifactory/saltproject-generic/windows/${version}/Salt-Minion-${version}-Py3-x86-Setup.exe`,
		`https://packages.broadcom.com/artifactory/saltproject-generic/windows/${version}/Salt-Minion-${version}-Py3-x86.msi`,
	];

	return {
		version,
		urls,
	};
}
