import { pageMatch } from '@/strategies.ts';

export default async function () {
	const version = await pageMatch(
		'https://ilspy.net/updates.xml',
		/<latestVersion>(\d+(?:\.\d+)+)<\/latestVersion>/i,
	);
	const downloadVersion = version.split('.').slice(0, 2).join('.');
	const urls = [
		`https://github.com/icsharpcode/ILSpy/releases/download/v${downloadVersion}/ILSpy_Installer_${version}-x64.msi`,
		`https://github.com/icsharpcode/ILSpy/releases/download/v${downloadVersion}/ILSpy_Installer_${version}-arm64.msi`,
	];

	return {
		version,
		urls,
	};
}
