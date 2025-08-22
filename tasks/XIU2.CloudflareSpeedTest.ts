import { getLatestRelease } from '../src/github.ts';

export default async function () {
	const version = await getLatestRelease('XIU2', 'CloudflareSpeedTest');
	const urls = [
		`https://github.com/XIU2/CloudflareSpeedTest/releases/download/v${version}/cfst_windows_386.zip`,
		`https://github.com/XIU2/CloudflareSpeedTest/releases/download/v${version}/cfst_windows_amd64.zip`,
		`https://github.com/XIU2/CloudflareSpeedTest/releases/download/v${version}/cfst_windows_arm64.zip`,
	];

	return {
		version,
		urls,
	};
}
