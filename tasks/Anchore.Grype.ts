import { getLatestRelease } from '../src/github.ts';

export default async function () {
	const version = await getLatestRelease('anchore', 'grype');
	const urls = [
		`https://github.com/anchore/grype/releases/download/v${version}/grype_${version}_windows_amd64.zip`,
	];

	return {
		version,
		urls,
	};
}
