import { updatePackage } from '../src/komac.ts';
import { electronBuilder } from '../src/helpers.ts';

export default async function () {
	const versionInfo = await fetch(
		'https://app.tuta.com/desktop/latest.yml',
	).then((res) => res.text());

	const version = electronBuilder(versionInfo);
	const urls = [
		`https://github.com/tutao/tutanota/releases/download/tutanota-desktop-release-${version}/tutanota-desktop-win.exe|x64`,
	];

	await updatePackage('Tutanota.Tutanota', version, urls);
}
