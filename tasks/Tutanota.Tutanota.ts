import { electronBuilder } from '../src/helpers.ts';

export default async function () {
	const response = await fetch('https://app.tuta.com/desktop/latest.yml');
	const versionInfo = await response.text();

	const version = electronBuilder(versionInfo);
	const urls = [
		`https://github.com/tutao/tutanota/releases/download/tutanota-desktop-release-${version}/tutanota-desktop-win.exe|x64`,
	];

	return {
		packageId: 'Tutanota.Tutanota',
		version,
		urls,
	};
}
