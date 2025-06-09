import { validateString } from '../src/validate.ts';

export default async function () {
	const response = await fetch(
		'https://assets.dataflare.app/release/windows/x86_64/latest.json',
	);
	const versionInfo = await response.json();

	const version = validateString(versionInfo.version);
	const urls = [
		`https://assets.dataflare.app/release/windows/x86_64/Dataflare-Setup-${version}.exe`,
	];

	return {
		version,
		urls,
	};
}
