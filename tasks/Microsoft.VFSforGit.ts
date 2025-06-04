import { getLatestRelease } from '../src/github.ts';

export default async function () {
	const version = await getLatestRelease('microsoft', 'VFSForGit');
	const urls = [
		`https://github.com/microsoft/VFSForGit/releases/download/v${version}/SetupGVFS.${version}.exe`,
	];

	return {
		version,
		urls,
	};
}
