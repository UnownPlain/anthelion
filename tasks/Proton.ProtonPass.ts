import { validateString } from '../src/validate.ts';

export default async function () {
	const response = await fetch(
		'https://proton.me/download/PassDesktop/windows/version.json',
	);
	const versionInfo = await response.json();
	const versions = versionInfo.Releases.filter(
		// @ts-ignore .
		(version) => version.CategoryName === 'Stable',
	);

	const version = validateString(versions[0].Version);
	const urls = [
		`https://proton.me/download/pass/windows/ProtonPass_Setup_${version}.exe|x64`,
	];

	return {
		version,
		urls,
	};
}
