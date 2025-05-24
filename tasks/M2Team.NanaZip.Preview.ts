import { getLatestPreRelease } from '../src/github.ts';

export default async function () {
	const version = await getLatestPreRelease('M2Team', 'NanaZip');
	const urls = [
		`https://github.com/M2Team/NanaZip/releases/download/${version}/NanaZip_${version}.msixbundle`,
	];

	return {
		packageId: 'M2Team.NanaZip.Preview',
		version,
		urls,
	};
}
