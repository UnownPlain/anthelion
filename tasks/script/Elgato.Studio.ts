import { vs } from '@/helpers.ts';
import ky from 'ky';

export default async function () {
	const releases = await ky(
		'https://gc-updates.elgato.com/windows/estw-update/final/app-version-check.json.php',
	).json<{
		Manual: {
			Version: string;
			ReleaseNotes: { en: string };
			fileURLs: { x86_64: string; arm64: string };
		};
	}>();

	const version = vs(releases.Manual.Version);
	const urls = [
		vs(releases.Manual.fileURLs.x86_64),
		vs(releases.Manual.fileURLs.arm64),
	];

	return {
		version,
		urls,
		args: ['--release-notes-url', vs(releases.Manual.ReleaseNotes.en)],
	};
}
