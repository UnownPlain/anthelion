import { getLatestRelease } from '../src/github.ts';
import { updatePackage } from '../src/komac.ts';

export default async function () {
	const version = await getLatestRelease('usebruno', 'bruno');
	const urls = [
		`https://github.com/usebruno/bruno/releases/download/v${version}/bruno_${version}_x64_win.exe`,
	];

	await updatePackage('Bruno.Bruno', version, urls);
}
