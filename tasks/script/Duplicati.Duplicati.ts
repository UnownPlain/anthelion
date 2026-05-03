import { getLatestRelease } from '@/github.ts';

export default async function () {
	const release = await getLatestRelease({
		owner: 'duplicati',
		repo: 'duplicati',
	});

	const version = release.tag.split('_')[0];
	const urls = () =>
		release
			.urls()
			.filter((url) => url.includes('win') && url.includes('gui') && url.endsWith('.msi'));

	return {
		version,
		urls,
	};
}
