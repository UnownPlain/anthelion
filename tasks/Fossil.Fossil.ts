import { pageMatch } from '../src/helpers.ts';

export default async function () {
	const version = await pageMatch(
		'https://www.fossil-scm.org/home/uv/download.js',
		/"title":\s*?"Version (\d+(?:\.\d+)+)\s*?\(/i,
	);
	const urls = [
		`https://fossil-scm.org/home/uv/fossil-w64-${version}.zip`,
		`https://fossil-scm.org/home/uv/fossil-w32-${version}.zip`,
	];

	return {
		version,
		urls,
		args: [
			'--release-notes-url',
			`https://fossil-scm.org/home/doc/trunk/www/changes.wiki#v${version.replace(
				'.',
				'_',
			)}`,
		],
	};
}
