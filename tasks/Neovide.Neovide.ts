import { getLatestRelease } from '../src/github.ts';

export default async function () {
	const version = await getLatestRelease('neovide', 'neovide');
	const urls = [
		`https://github.com/neovide/neovide/releases/download/${version}/neovide.msi`,
	];

	return {
		packageId: 'Neovide.Neovide',
		version,
		urls,
	};
}
