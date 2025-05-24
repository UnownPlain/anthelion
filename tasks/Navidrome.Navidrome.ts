import { getLatestRelease } from '../src/github.ts';

export default async function () {
	const version = await getLatestRelease('navidrome', 'navidrome');
	const urls = [
		`https://github.com/navidrome/navidrome/releases/download/v${version}/navidrome_${version}_windows_386_installer.msi`,
		`https://github.com/navidrome/navidrome/releases/download/v${version}/navidrome_${version}_windows_amd64_installer.msi`,
	];

	return {
		version,
		urls,
	};
}
