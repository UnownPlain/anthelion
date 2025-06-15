import { getLatestRelease } from '../src/github.ts';

export default async function () {
	const version = await getLatestRelease('aardappel', 'lobster');
	const urls = [
		`https://github.com/aardappel/lobster/releases/download/v${version}/lobster_windows_release.zip`,
	];

	return {
		version,
		urls,
	};
}
