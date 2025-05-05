import { updatePackage } from '../src/komac.ts';
import { validateString } from '../src/validate.ts';

export default async function () {
	const versionInfo = await fetch(
		'https://proton.me/download/PassDesktop/windows/version.json',
	).then((res) => res.json());

	const versions = versionInfo.Releases.filter(
		// @ts-ignore .
		(version) => version.CategoryName === 'Stable',
	);

	const version = validateString(versions[0].Version);
	const urls = [
		`https://proton.me/download/pass/windows/ProtonPass_Setup_${version}.exe`,
	];

	await updatePackage('Proton.ProtonPass', version, urls);
}
