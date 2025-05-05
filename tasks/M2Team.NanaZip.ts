import { getLatestRelease } from '../src/github.ts';
import { updatePackage } from '../src/komac.ts';

export default async function () {
	const version = await getLatestRelease('M2Team', 'NanaZip');
	const urls = [
		`https://github.com/M2Team/NanaZip/releases/download/${version}/NanaZip_${version}.msixbundle`,
	];

	await updatePackage('M2Team.NanaZip', version, urls);
}
