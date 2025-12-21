import { getLatestVersion } from '@/github.ts';

export default async function () {
	const { version, urls } = await getLatestVersion({
		owner: 'YACReader',
		repo: 'yacreader',
	});

	return {
		version,
		urls: urls.filter((url) => url.includes('qt')),
	};
}
