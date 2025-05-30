import { getLatestRelease } from '../src/github.ts';

export default async function () {
	const version = await getLatestRelease('f3d-app', 'f3d');
	const urls = [
		`https://github.com/f3d-app/f3d/releases/download/v${version}/F3D-${version}-Windows-x86_64.exe`,
	];

	return {
		version,
		urls,
	};
}
