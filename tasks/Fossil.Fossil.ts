import { matchAndValidate } from '../src/validate.ts';
import ky from 'ky';

export default async function () {
	const versionInfo = await ky(
		'https://www.fossil-scm.org/home/uv/download.js',
	).text();
	const regex = /"title":\s*?"Version (\d+(?:\.\d+)+)\s*?\(/i;

	const version = matchAndValidate(versionInfo, regex)[1];
	const urls = [
		`https://fossil-scm.org/home/uv/fossil-w64-${version}.zip`,
		`https://fossil-scm.org/home/uv/fossil-w32-${version}.zip`,
	];

	return {
		version,
		urls,
		args: [
			'--release-notes-url',
			`https://fossil-scm.org/home/doc/trunk/www/changes.wiki#v${
				version.replace('.', '_')
			}`,
		],
	};
}
