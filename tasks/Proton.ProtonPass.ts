import { validateString } from '../src/validate.ts';
import ky from 'ky';

export default async function () {
	const versionInfo = (await ky(
		'https://proton.me/download/PassDesktop/windows/version.json',
	).json()) as { Releases: Array<{ CategoryName: string; Version: string }> };

	const versions = versionInfo.Releases.filter(
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
