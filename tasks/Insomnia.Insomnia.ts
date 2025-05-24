import { getLatestRelease } from '../src/github.ts';

export default async function () {
	const latestRelease = await getLatestRelease('Kong', 'insomnia');

	const version = latestRelease.split('@')[1];
	const urls = [
		`https://github.com/Kong/insomnia/releases/download/core@${version}/Insomnia.Core-${version}.exe`,
	];

	return {
		packageId: 'Insomnia.Insomnia',
		version,
		urls,
	};
}
