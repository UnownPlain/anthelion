import { electronBuilder } from '../src/helpers.ts';
import { updatePackage } from '../src/komac.ts';

export default async function () {
	const response = await fetch(
		'https://github.com/kopia/kopia/releases/latest/download/latest.yml',
	);
	const versionInfo = await response.text();

	const version = electronBuilder(versionInfo);
	const urls = [
		`https://github.com/kopia/kopia/releases/download/v${version}/KopiaUI-Setup-${version}.exe`,
	];

	await updatePackage('Kopia.KopiaUI', version, urls);
}
