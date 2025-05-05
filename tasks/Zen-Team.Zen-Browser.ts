import { getLatestRelease } from '../src/github.ts';
import { updatePackage } from '../src/komac.ts';

export default async function () {
	const version = await getLatestRelease('zen-browser', 'desktop');
	const urls = [
		`https://github.com/zen-browser/desktop/releases/download/${version}/zen.installer.exe|x64`,
		`https://github.com/zen-browser/desktop/releases/download/${version}/zen.installer-arm64.exe`,
	];

	await updatePackage(
		'Zen-Team.Zen-Browser',
		version,
		urls,
		'--release-notes-url',
		`https://zen-browser.app/release-notes/#${version}`,
	);
}
