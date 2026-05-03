import { getLatestRelease } from '@/github.ts';
import { match } from '@/helpers';

export default async function () {
	const release = await getLatestRelease({
		owner: 'git-for-windows',
		repo: 'git',
	});

	const version = match(release.tag, /^(\d+(?:\.\d+)+)\.windows\.(\d+)$/);
	const baseVersion = version[0];
	const buildNumber = version[1];
	const finalVersion = buildNumber === '1' ? baseVersion : `${baseVersion}.${buildNumber}`;

	const urls = () =>
		release
			.urls()
			.filter((url) => url.includes('MinGit') && url.endsWith('.zip') && !url.includes('busybox'));

	return {
		version: finalVersion,
		urls,
	};
}
