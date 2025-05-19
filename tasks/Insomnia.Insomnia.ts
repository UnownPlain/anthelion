import { getLatestRelease } from '../src/github.ts';
import { updatePackage } from '../src/komac.ts';

export default async function () {
	const latestRelease = await getLatestRelease('Kong', 'insomnia');

	const version = latestRelease.split('@')[1];
	const urls = [
		`https://github.com/Kong/insomnia/releases/download/core@${version}/Insomnia.Core-${version}.exe`,
	];

	await updatePackage('Insomnia.Insomnia', version, urls);
}
