import { getLatestVersion } from '@/github.ts';
import { match } from '@/helpers';

export default async function () {
	const { version: tag } = await getLatestVersion({
		owner: 'git-for-windows',
		repo: 'git',
	});

	const version = match(tag, /^(\d+(?:\.\d+)+)\.windows\.(\d+)$/);
	const baseVersion = version[0];
	const buildNumber = version[1];
	const finalVersion = buildNumber === '1' ? baseVersion : `${baseVersion}.${buildNumber}`;

	const urls = [
		`https://github.com/git-for-windows/git/releases/download/v${tag}/MinGit-${baseVersion}-32-bit.zip`,
		`https://github.com/git-for-windows/git/releases/download/v${tag}/MinGit-${baseVersion}-64-bit.zip`,
		`https://github.com/git-for-windows/git/releases/download/v${tag}/MinGit-${baseVersion}-arm64.zip`,
	];

	return {
		version: finalVersion,
		urls,
	};
}
