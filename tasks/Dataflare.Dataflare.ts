import { validateString } from '../src/validate.ts';
import ky from 'ky';

export default async function () {
	const versionInfo = await ky(
		'https://assets.dataflare.app/release/windows/x86_64/latest.json',
	).json<{ version: string }>();

	const version = validateString(versionInfo.version);
	const urls = [
		`https://assets.dataflare.app/release/windows/x86_64/Dataflare-Setup-${version}.exe`,
	];

	return {
		version,
		urls,
	};
}
