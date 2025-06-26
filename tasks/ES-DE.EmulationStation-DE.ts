import { validateString } from '../src/validate.ts';
import ky from 'ky';

export default async function () {
	const versionInfo = await ky(
		'https://gitlab.com/api/v4/projects/es-de%2Femulationstation-de/releases',
	).json<
		Array<{
			tag_name: string;
			assets: { links: Array<{ url: string; name: string }> };
		}>
	>();

	const version = validateString(versionInfo[0].tag_name.substring(1));
	const urls = [
		`${
			validateString(
				versionInfo[0].assets.links.filter((url) =>
					url.name.includes('.exe')
				)[0]
					.url,
			)
		}`,
	];

	return {
		version,
		urls,
	};
}
