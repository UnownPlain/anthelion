import { validateString } from '../src/validate.ts';
import ky from 'ky';

export default async function () {
	const versionInfo = await ky(
		'https://gc-updates.elgato.com/windows/estw-update/final/app-version-check.json.php',
	).json<{
		Manual: {
			Version: string;
			ReleaseNotes: {
				en: string;
			};
			fileURLs: {
				x86_64: string;
				arm64: string;
			};
		};
	}>();

	const version = validateString(versionInfo.Manual.Version);
	const urls = [
		validateString(versionInfo.Manual.fileURLs.x86_64),
		validateString(versionInfo.Manual.fileURLs.arm64),
	];

	return {
		version,
		urls,
		args: [
			'--release-notes-url',
			validateString(versionInfo.Manual.ReleaseNotes.en),
		],
	};
}
