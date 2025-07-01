import { getLatestRelease } from '../src/github.ts';

export default async function () {
	const version = await getLatestRelease('crossplane', 'crossplane');
	const urls = [
		`https://releases.crossplane.io/stable/v${version}/bin/windows_amd64/crossplane.exe`,
	];

	return {
		version,
		urls,
	};
}
