import { getLatestRelease, getLatestUrls } from '../src/github.ts';

export default async function () {
	const version = await getLatestRelease('streamlink', 'windows-builds');
	const urls = await getLatestUrls('streamlink', 'windows-builds');

	return {
		packageId: 'Streamlink.Streamlink',
		version,
		urls,
	};
}
