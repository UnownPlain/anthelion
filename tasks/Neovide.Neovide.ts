import { getLatestRelease } from '../src/github.ts';
import { updatePackage } from '../src/komac.ts';

export default async function () {
	const version = await getLatestRelease('neovide', 'neovide');
	const urls = [
		`https://github.com/neovide/neovide/releases/download/${version}/neovide.msi`,
	];

	await updatePackage('Neovide.Neovide', version, urls);
}
