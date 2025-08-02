import { getLatestRelease } from '../src/github.ts';

export default async function () {
	const version = await getLatestRelease('artpixls', 'ART');
	const urls = [
		`https://github.com/artpixls/ART/releases/download/${version}/ART_${version}_Win64.exe`,
		`https://github.com/artpixls/ART/releases/download/${version}/ART_${version}_Windows_arm64.exe`,
	];

	return {
		version,
		urls,
	};
}
