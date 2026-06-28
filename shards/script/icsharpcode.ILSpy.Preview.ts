import { getLatestRelease } from '@/github.ts';
import { match } from '@/helpers';
import { defineShard } from '@/schema/script-shard.ts';

export default defineShard(async () => {
	const release = await getLatestRelease({
		owner: 'icsharpcode',
		repo: 'ILSpy',
		kind: 'all',
		tagIncludes: 'preview',
	});

	const urls = () => release.urls().filter((url) => url.endsWith('.msi'));
	const asset = release.assetNames().find((name) => name.endsWith('.msi'));
	const [version] = match(
		asset,
		/ILSpy_Installer_(\d+(?:\.\d+){3}-preview\d+)-(?:x64|arm64)\.msi$/i,
	);

	return {
		version,
		urls,
	};
});
