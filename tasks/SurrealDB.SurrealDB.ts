import { getLatestRelease } from '../src/github.ts';

export default async function () {
	const version = await getLatestRelease('surrealdb', 'surrealdb');
	const urls = [
		`https://github.com/surrealdb/surrealdb/releases/download/v${version}/surreal-v${version}.windows-amd64.exe`,
	];

	return {
		version,
		urls,
	};
}
