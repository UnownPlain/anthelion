import { getLatestRelease } from '../src/github.ts';

export default async function () {
	const version = await getLatestRelease('tildearrow', 'furnace');
	const urls = [
		`https://github.com/tildearrow/furnace/releases/download/v${version}/furnace-${version}-win32.zip`,
		`https://github.com/tildearrow/furnace/releases/download/v${version}/furnace-${version}-win64.zip`,
	];

	return {
		version,
		urls,
	};
}
