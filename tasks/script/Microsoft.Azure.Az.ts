import { getLatestRelease } from '@/github.ts';
import { match } from '@/helpers';

export default async function () {
	const owner = 'Azure';
	const repo = 'azure-powershell';
	const release = await getLatestRelease({ owner, repo, useLatestEndpoint: true });

	const urls = () => release.urls().filter((url) => url.includes('x64'));
	const [version] = match(urls()[0], /Az-Cmdlets-(\d+(?:\.\d+)+)-(?:x64|x86)\.msi/i);

	return {
		version,
		urls,
		releaseNotes: {
			source: 'github',
			owner,
			repo,
			tag: release.rawTag,
			cleanup: true,
		},
	};
}
