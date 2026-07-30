import { defineShard } from '@/schema/script-shard.ts';
import { pageMatch } from '@/strategies.ts';

export default defineShard(async () => {
	const {
		groups: [version, releaseTag],
	} = await pageMatch({
		url: 'https://ilspy.net/updates.xml',
		regex:
			/<latestVersion>(\d+(?:\.\d+)+)<\/latestVersion>[\s\S]*?<releaseTag>(v\d+(?:\.\d+)+)<\/releaseTag>/i,
	});
	const urls = () => [
		`https://github.com/icsharpcode/ILSpy/releases/download/${releaseTag}/ILSpy_Installer_${version}-x64.msi`,
		`https://github.com/icsharpcode/ILSpy/releases/download/${releaseTag}/ILSpy_Installer_${version}-arm64.msi`,
	];

	return {
		version,
		urls,
	};
});
