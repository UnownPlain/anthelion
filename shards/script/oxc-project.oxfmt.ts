import { getLatestRelease } from '@/github.ts';
import { match } from '@/helpers.ts';
import { ReleaseNotesSource } from '@/schema/release-notes.ts';
import { defineShard } from '@/schema/script-shard.ts';

export default defineShard(async () => {
	const owner = 'oxc-project';
	const repo = 'oxc';
	const release = await getLatestRelease({
		owner,
		repo,
		tagIncludes: 'apps_v',
	});

	const [version] = match(release.title ?? '', /oxfmt v(\d+(?:\.\d+)+)/i);
	const urls = () =>
		release.urls().filter((url) => url.includes('oxfmt') && url.endsWith('pc-windows-msvc.zip'));

	return {
		version,
		urls,
		releaseNotes: {
			source: ReleaseNotesSource.Github,
			owner,
			repo,
			tag: release.tag,
			cleanup: true,
		},
	};
});
