import { validateString } from '../src/validate.ts';
import ky from 'ky';

export default async function () {
	const versionInfo = await ky(
		'https://packages.broadcom.com/artifactory/saltproject-generic/windows/',
	).text();
	const regex = /href=["']?(\d+(?:\.\d+)*)\/?["' >]/gi;
	const matches = versionInfo.matchAll(regex);
	const versions = Array.from(matches, (match) => match[1]).reverse();

	const version = validateString(versions[0]);
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
