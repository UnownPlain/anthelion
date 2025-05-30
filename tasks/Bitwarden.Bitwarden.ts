import { electronBuilder } from '../src/helpers.ts';

export default async function () {
	const version = await electronBuilder(
		'https://artifacts.bitwarden.com/desktop/latest.yml'
	);
	const urls = [
		`https://github.com/bitwarden/clients/releases/download/desktop-v${version}/Bitwarden-Installer-${version}.exe|neutral`,
	];

	return {
		version,
		urls,
	};
}
