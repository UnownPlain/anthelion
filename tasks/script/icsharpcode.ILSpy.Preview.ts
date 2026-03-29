import { getAllReleases } from '@/github.ts';
import { match } from '@/helpers';

export default async function () {
	const releases = await getAllReleases('icsharpcode', 'ILSpy', 'all');
	const release = releases.filter((release) => release.tag_name.includes('preview'))[0];

	const urls = release?.assets
		.filter((release) => release.browser_download_url.includes('.msi'))
		.map((release) => release.browser_download_url);
	const [version] = match(
		urls?.[0],
		/ILSpy_Installer_(\d+(?:\.\d+){3}-preview\d+)-(?:x64|arm64)\.msi$/i,
	);

	return {
		version,
		urls,
	};
}
