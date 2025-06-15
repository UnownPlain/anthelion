import { getLatestRelease } from '../src/github.ts';

export default async function () {
	const version = await getLatestRelease('Picocrypt', 'Picocrypt');
	const urls = [
		`https://github.com/Picocrypt/Picocrypt/releases/download/${version}/Picocrypt.exe`,
	];

	return {
		version,
		urls,
	};
}
