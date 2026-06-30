import { getLatestReleaseFromRedirect } from '@/github.ts';
import { match } from '@/helpers';
import { ReleaseNotesSource } from '@/schema/release-notes';
import { defineShard } from '@/schema/script-shard.ts';

export default defineShard(async () => {
	const owner = 'git-for-windows';
	const repo = 'git';
	const release = await getLatestReleaseFromRedirect({ owner, repo });

	const version = match(release.tag, /^(\d+(?:\.\d+)+)\.windows\.(\d+)$/);
	const baseVersion = version[0];
	const buildNumber = version[1];
	const finalVersion = buildNumber === '1' ? baseVersion : `${baseVersion}.${buildNumber}`;

	const urls = () => [
		`https://github.com/git-for-windows/git/releases/download/${release.rawTag}/MinGit-${finalVersion}-32-bit.zip`,
		`https://github.com/git-for-windows/git/releases/download/${release.rawTag}/MinGit-${finalVersion}-64-bit.zip`,
		`https://github.com/git-for-windows/git/releases/download/${release.rawTag}/MinGit-${finalVersion}-arm64.zip`,
	];

	return {
		version: finalVersion,
		urls,
		releaseNotes: {
			source: ReleaseNotesSource.Github,
			cleanup: true,
			owner,
			repo,
			tag: release.rawTag,
		},
	};
});
