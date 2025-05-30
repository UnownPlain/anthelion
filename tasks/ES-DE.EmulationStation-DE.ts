import { validateString } from '../src/validate.ts';

export default async function () {
	const response = await fetch(
		'https://gitlab.com/api/v4/projects/es-de%2Femulationstation-de/releases',
	);
	const versionInfo = await response.json();

	const version = validateString(versionInfo[0].tag_name.substring(1));
	const urls = [
		`${
			validateString(
				// @ts-ignore .
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
