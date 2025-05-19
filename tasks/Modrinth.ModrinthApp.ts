import { updatePackage } from '../src/komac.ts';
import { validateString } from '../src/validate.ts';

export default async function () {
	const response = await fetch(
		'https://launcher-files.modrinth.com/updates.json',
	);
	const versionInfo = await response.json();

	const version = validateString(versionInfo.version);
	const urls = [
		`https://launcher-files.modrinth.com/versions/${version}/windows/Modrinth%20App_${version}_x64-setup.exe`,
	];

	await updatePackage(
		'Modrinth.ModrinthApp',
		version,
		urls,
		'--release-notes-url',
		'https://modrinth.com/news/changelog?filter=app',
	);
}
