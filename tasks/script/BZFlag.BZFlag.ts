import { sortVersions } from '@/strategies.ts';
import ky from 'ky';

export default async function () {
	const versionInfo = await ky('https://download.bzflag.org/bzflag/windows/').text();
	const version = sortVersions(versionInfo, /href=["']?v?(\d+(?:\.\d+)+)\/?["' >]/gi);

	const urls = [`https://download.bzflag.org/bzflag/windows/${version}/bzflag-${version}.exe`];

	return {
		version,
		urls,
	};
}
