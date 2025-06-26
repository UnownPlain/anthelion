import { validateString } from '../src/validate.ts';
import ky from 'ky';

export default async function () {
	const versionInfo = await ky(
		'https://launcher-files.modrinth.com/updates.json',
	).json<{
		version: string;
		platforms: { [key: string]: { url: string } };
	}>();

	const version = validateString(versionInfo.version);
	const urls = [
		`https://launcher-files.modrinth.com/versions/${version}/windows/Modrinth%20App_${version}_x64-setup.exe`,
	];

	return {
		version,
		urls,
		args: [
			'--release-notes-url',
			'https://modrinth.com/news/changelog?filter=app',
		],
	};
}
