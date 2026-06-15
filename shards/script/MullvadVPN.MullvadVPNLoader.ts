import { getLatestRelease } from '@/github.ts';

export default async function () {
	const { version, urls } = await getLatestRelease({
		owner: 'mullvad',
		repo: 'mullvadvpn-app',
		tagIncludes: 'desktop/installer-downloader/',
		perPage: 50,
	});

	return {
		version,
		urls,
	};
}
