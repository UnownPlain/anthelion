import { getLatestRelease } from '../src/github.ts';

export default async function () {
	const version = await getLatestRelease('obsproject', 'obs-studio');
	const urls = [
		`https://github.com/obsproject/obs-studio/releases/download/${version}/OBS-Studio-${version}-Windows-Installer.exe`,
	];

	return {
		packageId: 'OBSProject.OBSStudio',
		version,
		urls,
	};
}
