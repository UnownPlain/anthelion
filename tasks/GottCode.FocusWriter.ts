import { getLatestRelease } from '../src/github.ts';

export default async function () {
	const version = await getLatestRelease('gottcode', 'focuswriter');
	const urls = [`https://gottcode.org/focuswriter/FocusWriter_${version}.exe`];

	return {
		version,
		urls,
	};
}
