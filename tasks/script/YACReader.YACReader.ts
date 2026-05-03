import { getLatestRelease } from '@/github.ts';

export default async function () {
	const { version, urls } = await getLatestRelease({
		owner: 'YACReader',
		repo: 'yacreader',
	});

	return {
		version,
		urls: () => urls().filter((url) => url.includes('qt')),
	};
}
