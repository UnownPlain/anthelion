import { electronBuilder } from '../src/helpers.ts';

export default async function () {
	const response = await fetch(
		'https://artifacts.bitwarden.com/desktop/latest.yml',
	);
	const versionInfo = await response.text();

	const version = electronBuilder(versionInfo);
	const urls = [
		`https://github.com/bitwarden/clients/releases/download/desktop-v${version}/Bitwarden-Installer-${version}.exe`,
	];

	return {
		packageId: 'Bitwarden.Bitwarden',
		version,
		urls,
	};
}
