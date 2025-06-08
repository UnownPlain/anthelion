import { getLatestRelease } from '../src/github.ts';

export default async function () {
	const version = await getLatestRelease('fishstrap', 'fishstrap');
	const urls = [
		`https://github.com/fishstrap/fishstrap/releases/download/v${version}/Fishstrap-v${version}.exe`,
	];

	return {
		version,
		urls,
	};
}
