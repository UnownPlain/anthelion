import { getLatestRelease } from '../src/github.ts';

export default async function () {
	const version = await getLatestRelease('massCodeIO', 'massCode');
	const urls = [
		`https://github.com/massCodeIO/massCode/releases/download/v${version}/massCode.Setup.${version}.exe`,
	];

	return {
		version,
		urls,
	};
}
