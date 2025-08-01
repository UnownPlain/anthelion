import { getLatestPreRelease } from '../src/github.ts';

export default async function () {
	const version = await getLatestPreRelease('artpixls', 'ART');
	const urls = [
		`https://github.com/artpixls/ART/releases/download/${version}/ART_${version}_Win64.exe`,
		`https://github.com/artpixls/ART/releases/download/${version}/ART_${version}_Windows_arm64.exe`,
	];

	return {
		version,
		urls,
	};
}
