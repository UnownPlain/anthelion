import { vs } from '@/helpers.ts';
import ky from 'ky';

export default async function () {
	const releases = await ky(
		'https://proton.me/download/PassDesktop/windows/version.json',
	).json<{ Releases: Array<{ CategoryName: string; Version: string }> }>();
	const versions = releases.Releases.filter(
		(version) => version.CategoryName === 'Stable',
	);

	const version = vs(versions[0]?.Version);
	const urls = [
		`https://proton.me/download/pass/windows/ProtonPass_Setup_${version}.exe|x64`,
	];

	return {
		version,
		urls,
	};
}
