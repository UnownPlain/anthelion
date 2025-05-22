import { getLatestRelease } from '../src/github.ts';
import { updatePackage } from '../src/komac.ts';

export default async function () {
	const version = await getLatestRelease('vrcx-team', 'VRCX');
	const urls = [
		`https://github.com/vrcx-team/VRCX/releases/download/v${version}/VRCX_${
			version.replaceAll(
				'.',
				'',
			)
		}_Setup.exe`,
	];

	await updatePackage('VRCX.VRCX', version, urls);
}
