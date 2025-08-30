import { getAllReleases } from '@/github.ts';
import { vs } from '@/helpers.ts';

export default async function () {
	const releases = await getAllReleases('biomejs', 'biome');
	const release = releases.find((r) =>
		r.tag_name.startsWith('@biomejs/biome@'),
	);

	const version = vs(release?.tag_name.replace('@biomejs/biome@', ''));
	const urls = [
		`https://github.com/biomejs/biome/releases/download/@biomejs/biome@${version}/biome-win32-x64.exe`,
		`https://github.com/biomejs/biome/releases/download/@biomejs/biome@${version}/biome-win32-arm64.exe`,
	];

	return {
		version,
		urls,
	};
}
