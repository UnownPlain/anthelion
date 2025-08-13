import { getAllReleases } from '../src/github.ts';

export default async function () {
	const version = (await getAllReleases('biomejs', 'biome'))
		.filter((release) => release.tag_name.startsWith('@biomejs/biome@'))[0]
		.tag_name.replace('@biomejs/biome@', '');
	const urls = [
		`https://github.com/biomejs/biome/releases/download/@biomejs/biome@${version}/biome-win32-x64.exe`,
		`https://github.com/biomejs/biome/releases/download/@biomejs/biome@${version}/biome-win32-arm64.exe`,
	];

	return {
		version,
		urls,
	};
}
