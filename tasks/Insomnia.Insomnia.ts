import { getLatestRelease } from '../src/github.ts';
import { updatePackage } from '../src/komac.ts';

export default async function () {
	const version = (await getLatestRelease('Kong', 'insomnia')).split('@')[1];
	const urls = [
		`https://github.com/Kong/insomnia/releases/download/core@${version}/Insomnia.Core-${version}.exe`,
	];

	await updatePackage('Insomnia.Insomnia', version, urls);
}
