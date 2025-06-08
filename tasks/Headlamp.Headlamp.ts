import { getLatestRelease } from '../src/github.ts';

export default async function () {
	const version = await getLatestRelease('kubernetes-sigs', 'headlamp');
	const urls = [
		`https://github.com/kubernetes-sigs/headlamp/releases/download/v${version}/Headlamp-${version}-win-x64.exe`,
	];

	return {
		version,
		urls,
	};
}
