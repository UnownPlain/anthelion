import ky from 'ky';

export default async function () {
	const releases = await ky(
		'https://gitlab.com/api/v4/projects/es-de%2Femulationstation-de/releases',
	).json<
		Array<{
			tag_name: string;
			assets: { links: Array<{ url: string; name: string }> };
		}>
	>();

	const version = releases[0]?.tag_name.substring(1);
	const urls = releases[0]?.assets.links
		.filter((link) => link.name.includes('.exe'))
		?.map((link) => link.url);

	return {
		version,
		urls,
	};
}
