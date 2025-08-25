import { pageMatch } from '../src/helpers.ts';

export default async function () {
	const version = await pageMatch(
		'https://www.xreveal.com/download.html',
		/xreveal[._-]v?(\d+(?:\.\d+)+)[._-]x\d+\.exe/i,
	);
	const urls = [
		`https://www.xreveal.com/download/xreveal_${version}_x64.exe`,
		`https://www.xreveal.com/download/xreveal_${version}_x86.exe`,
		`https://www.xreveal.com/download/xreveal_${version}_arm64.exe`,
	];

	return {
		version,
		urls,
	};
}
