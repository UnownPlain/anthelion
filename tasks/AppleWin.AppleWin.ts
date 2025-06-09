import { getLatestRelease } from '../src/github.ts';

export default async function () {
	const version = await getLatestRelease('AppleWin', 'AppleWin');
	const urls = [
		`https://github.com/AppleWin/AppleWin/releases/download/v${version}/AppleWin${version}.zip`,
	];

	return {
		version,
		urls,
	};
}
