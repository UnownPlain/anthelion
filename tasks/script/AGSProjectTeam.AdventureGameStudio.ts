import { getLatestVersion, getLatestUrls } from '@/github.ts';

export default async function () {
	const version = await getLatestVersion('adventuregamestudio', 'ags');
	const urls = await getLatestUrls('adventuregamestudio', 'ags');

	return {
		version,
		urls,
	};
}
