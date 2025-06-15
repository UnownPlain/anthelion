import { getLatestRelease } from '../src/github.ts';

export default async function () {
	const version = await getLatestRelease('bluenviron', 'mediamtx');
	const urls = [
		`https://github.com/bluenviron/mediamtx/releases/download/v${version}/mediamtx_v${version}_windows_amd64.zip`,
	];

	return {
		version,
		urls,
	};
}
