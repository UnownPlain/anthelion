import { getLatestRelease } from '../src/github.ts';

export default async function () {
	const version = await getLatestRelease('RPTools', 'maptool');
	const urls = [
		`https://github.com/RPTools/maptool/releases/download/${version}/MapTool-${version}.msi`,
	];

	return {
		version,
		urls,
	};
}
