import ky from 'ky';

import { match } from '@/helpers';

export default async function () {
	const response = await ky('https://ilspy.net/updates.xml').text();
	const [version, releaseTag] = match(
		response,
		/<latestVersion>(\d+(?:\.\d+)+)<\/latestVersion>[\s\S]*?<releaseTag>(v\d+(?:\.\d+)+)<\/releaseTag>/i,
	);

	const urls = [
		`https://github.com/icsharpcode/ILSpy/releases/download/${releaseTag}/ILSpy_Installer_${version}-x64.msi`,
		`https://github.com/icsharpcode/ILSpy/releases/download/${releaseTag}/ILSpy_Installer_${version}-arm64.msi`,
	];

	return {
		version,
		urls,
	};
}
