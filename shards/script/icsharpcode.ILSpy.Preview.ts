import { getLatestRelease } from '@/github.ts';
import { match } from '@/helpers';
import { ReleaseNotesSource } from '@/schema/release-notes.ts';
import { defineShard } from '@/schema/script-shard.ts';

export default defineShard(async () => {
	const release = await getLatestRelease({
		owner: 'icsharpcode',
		repo: 'ILSpy',
		kind: 'all',
		tagRegex: 'preview',
	});

	const urls = () => release.urls().filter((url) => url.endsWith('.msi'));
	const asset = release.assetNames().find((name) => name.endsWith('.msi'));
	const {
		groups: [version],
	} = match(asset, /ILSpy_Installer_(\d+(?:\.\d+){3}-preview\d+)-(?:x64|arm64)\.msi$/i);

	return {
		version,
		urls,
		releaseNotes: {
			source: ReleaseNotesSource.Github,
			owner: 'icsharpcode',
			repo: 'ILSpy',
			tag: release.rawTag,
			cleanup: true,
		},
	};
});
