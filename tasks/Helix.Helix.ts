import { getLatestRelease } from '../src/github.ts';

export default async function () {
	const version = await getLatestRelease('helix-editor', 'helix');
	const urls = [
		`https://github.com/helix-editor/helix/releases/download/${version}/helix-${version}-x86_64-windows.zip`,
	];

	return {
		packageId: 'Helix.Helix',
		version,
		urls,
	};
}
