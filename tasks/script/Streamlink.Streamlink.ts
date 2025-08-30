import { getLatestVersion, getLatestUrls } from '@/github.ts';

export default async function () {
	const version = await getLatestVersion('streamlink', 'windows-builds');
	const urls = await getLatestUrls('streamlink', 'windows-builds');

	return {
		version,
		urls,
	};
}
