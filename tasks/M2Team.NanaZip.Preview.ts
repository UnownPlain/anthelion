import { getLatestPreRelease } from '../src/github.ts';
import { updatePackage } from '../src/komac.ts';

export default async function () {
	const version = await getLatestPreRelease('M2Team', 'NanaZip');
	const urls = [
		`https://github.com/M2Team/NanaZip/releases/download/${version}/NanaZip_${version}.msixbundle`,
	];

	await updatePackage('M2Team.NanaZip.Preview', version, urls);
}
