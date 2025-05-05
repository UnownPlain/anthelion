import { getLatestRelease } from '../src/github.ts';
import { updatePackage } from '../src/komac.ts';

export default async function () {
	const version = await getLatestRelease('obsproject', 'obs-studio');

	const urls = [
		`https://github.com/obsproject/obs-studio/releases/download/${version}/OBS-Studio-31.0.3-Windows-Installer.exe`,
	];

	await updatePackage('OBSProject.OBSStudio', version, urls);
}
