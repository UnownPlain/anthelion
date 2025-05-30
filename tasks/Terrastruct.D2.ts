import { getLatestRelease } from '../src/github.ts';

export default async function () {
	const version = await getLatestRelease('terrastruct', 'd2');
	const urls = [
		`https://github.com/terrastruct/d2/releases/download/v${version}/d2-v${version}-windows-amd64.msi`,
	];

	return {
		version,
		urls,
	};
}
