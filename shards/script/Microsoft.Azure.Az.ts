import { getLatestRelease } from '@/github.ts';
import { match } from '@/helpers';
import { ReleaseNotesSource } from '@/schema/release-notes.ts';
import { defineShard } from '@/schema/script-shard.ts';

export default defineShard(async () => {
	const owner = 'Azure';
	const repo = 'azure-powershell';
	const release = await getLatestRelease({ owner, repo, useLatestEndpoint: true });

	const urls = () => release.urls().filter((url) => url.includes('x64'));
	const [version] = match(urls()[0], /Az-Cmdlets-(\d+(?:\.\d+)+)-(?:x64|x86)\.msi/i);

	return {
		version,
		urls,
		releaseNotes: {
			source: ReleaseNotesSource.Github,
			owner,
			repo,
			tag: release.rawTag,
			cleanup: true,
		},
	};
});
