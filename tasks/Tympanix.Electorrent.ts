import { validateString } from '../src/validate.ts';

export default async function () {
	const response = await fetch(
		'https://electorrent.vercel.app/update/exe/0.0.0',
	);
	const versionInfo = await response.json();

	const version = validateString(versionInfo.name);
	const urls = [validateString(versionInfo.url)];

	return {
		version,
		urls,
	};
}
