import { getLatestRelease } from '../src/github.ts';

export default async function () {
	const version = await getLatestRelease('M2Team', 'NanaZip');
	const urls = [
		`https://github.com/M2Team/NanaZip/releases/download/${version}/NanaZip_${version}.msixbundle`,
	];

	return {
		version,
		urls,
	};
}
