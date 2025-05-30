import { getLatestRelease } from '../src/github.ts';

export default async function () {
	const version = await getLatestRelease('pressly', 'goose');
	const urls = [
		`https://github.com/pressly/goose/releases/download/v${version}/goose_windows_x86_64.exe`,
		`https://github.com/pressly/goose/releases/download/v${version}/goose_windows_arm64.exe`,
	];

	return {
		version,
		urls,
	};
}
