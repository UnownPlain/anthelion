import { getLatestRelease } from '../src/github.ts';

export default async function () {
	const version = await getLatestRelease('alire-project', 'alire');
	const urls = [
		`https://github.com/alire-project/alire/releases/download/v${version}/alr-${version}-installer-x86_64-windows.exe`,
	];

	return {
		version,
		urls,
	};
}
