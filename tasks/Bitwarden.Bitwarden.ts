import { electronBuilder } from '../src/helpers.ts';
import { updatePackage } from '../src/komac.ts';

export default async function () {
	const versionInfo = await fetch(
		'https://artifacts.bitwarden.com/desktop/latest.yml',
	).then((res) => res.text());

	const version = electronBuilder(versionInfo);
	const urls = [
		`https://github.com/bitwarden/clients/releases/download/desktop-v${version}/Bitwarden-Installer-${version}.exe`,
	];

	await updatePackage('Bitwarden.Bitwarden', version, urls);
}
