import { electronBuilder } from '../src/helpers.ts';

export default async function () {
	const version = await electronBuilder(
		'https://update.shadow.tech/launcher/prod/win/x64/latest.yml',
	);
	const urls = [
		`https://update.shadow.tech/launcher/prod/win/x64/ShadowPCSetup-${version}.exe`,
	];

	return {
		version,
		urls,
	};
}
