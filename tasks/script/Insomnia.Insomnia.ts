import { getLatestVersion } from '@/github.ts';

export default async function () {
	const { version: tag } = await getLatestVersion({
		owner: 'Kong',
		repo: 'insomnia',
	});

	const version = tag?.split('@')[1];
	const urls = [
		`https://github.com/Kong/insomnia/releases/download/core@${version}/Insomnia.Core-${version}.exe`,
	];

	return {
		version,
		urls,
	};
}
