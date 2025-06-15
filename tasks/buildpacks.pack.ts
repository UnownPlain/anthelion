import { getLatestRelease } from '../src/github.ts';

export default async function () {
	const version = await getLatestRelease('buildpacks', 'pack');
	const urls = [
		`https://github.com/buildpacks/pack/releases/download/v${version}/pack-v${version}-windows.zip`,
	];

	return {
		version,
		urls,
	};
}
