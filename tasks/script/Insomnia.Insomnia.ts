import { getLatestVersion } from '@/github.ts';
import { vs } from '@/helpers';

export default async function () {
	const latestRelease = await getLatestVersion('Kong', 'insomnia');

	const version = vs(latestRelease.split('@')[1]);
	const urls = [
		`https://github.com/Kong/insomnia/releases/download/core@${version}/Insomnia.Core-${version}.exe`,
	];

	return {
		version,
		urls,
	};
}
