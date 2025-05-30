import { validateMatch } from '../src/validate.ts';

export default async function () {
	const response = await fetch(
		'https://www.fossil-scm.org/home/uv/download.js',
	);
	const versionInfo = await response.text();
	const match = versionInfo.match(
		/"title":\s*?"Version (\d+(?:\.\d+)+)\s*?\(/i,
	);

	const version = validateMatch(match)[1];
	const urls = [
		`https://fossil-scm.org/home/uv/fossil-w64-${version}.zip`,
		`https://fossil-scm.org/home/uv/fossil-w32-${version}.zip`,
	];

	return {
		version,
		urls,
	};
}
