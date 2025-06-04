import { getLatestRelease } from '../src/github.ts';

export default async function () {
	const version = await getLatestRelease('ripose-jp', 'Memento');
	const urls = [
		`https://github.com/ripose-jp/Memento/releases/download/v${version}/Memento_Windows_x86_64_Installer.exe`,
	];

	return {
		version,
		urls,
	};
}
