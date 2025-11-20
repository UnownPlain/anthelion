import ky from 'ky';

export default async function () {
	const releases = await ky(
		'https://packages.broadcom.com/artifactory/saltproject-generic/windows/',
	).text();
	const matches = releases.matchAll(/href=["']?(\d+(?:\.\d+)*)\/?["' >]/gi);
	const versions = Array.from(matches, (match) => match[1]).reverse();

	const version = versions[0];
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
