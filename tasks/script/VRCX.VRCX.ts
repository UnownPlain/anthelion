import { getLatestVersion } from '@/github.ts';

export default async function () {
	const version = await getLatestVersion('vrcx-team', 'VRCX');
	const urls = [
		`https://github.com/vrcx-team/VRCX/releases/download/v${version}/VRCX_${version.replaceAll(
			'.',
			'',
		)}_Setup.exe`,
	];

	return {
		version,
		urls,
	};
}
