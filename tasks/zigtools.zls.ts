import { getLatestRelease } from '../src/github.ts';

export default async function () {
	const version = await getLatestRelease('zigtools', 'zls');
	const urls = [
		`https://github.com/zigtools/zls/releases/download/${version}/zls-x86_64-windows.zip`,
	];

	return {
		version,
		urls,
	};
}
