import ky from 'ky';

import { defineShard } from '@/schema/script-shard.ts';

export default defineShard(async () => {
	const releases = await ky(
		'https://gitlab.com/api/v4/projects/es-de%2Femulationstation-de/releases',
	).json<
		Array<{
			tag_name: string;
			assets: { links: Array<{ url: string; name: string }> };
		}>
	>();

	const release = releases[0];
	if (!release) {
		throw new Error('No GitLab release found');
	}

	const version = release.tag_name.substring(1);
	const urls = () =>
		release.assets.links.filter((link) => link.name.includes('.exe')).map((link) => link.url);

	return {
		version,
		urls,
	};
});
