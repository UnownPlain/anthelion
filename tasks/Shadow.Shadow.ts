import { updatePackage } from '../src/komac.ts';
import { electronBuilder } from '../src/helpers.ts';

export default async function () {
	const response = await fetch(
		'https://update.shadow.tech/launcher/prod/win/x64/latest.yml',
	);
	const versionInfo = await response.text();

	const version = electronBuilder(versionInfo);
	const urls = [
		`https://update.shadow.tech/launcher/prod/win/x64/ShadowPCSetup-${version}.exe`,
	];

	await updatePackage('Shadow.Shadow', version, urls);
}
