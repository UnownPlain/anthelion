import { getLatestRelease } from '@/github.ts';
import { match } from '@/helpers.ts';

export default async function () {
	const owner = 'oxc-project';
	const repo = 'oxc';
	const release = await getLatestRelease({
		owner,
		repo,
		tagIncludes: 'apps_v',
	});

	const [version] = match(release.title ?? '', /oxfmt v(\d+(?:\.\d+)+)/i);
	const urls = () => release.urls().filter((url) => url.endsWith('pc-windows-msvc.zip'));

	return {
		version,
		urls,
		releaseNotes: {
			source: 'github',
			owner,
			repo,
			tag: release.tag,
			cleanup: true,
		},
	};
}
