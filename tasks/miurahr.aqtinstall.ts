import { getLatestRelease } from '../src/github.ts';

export default async function () {
	const version = await getLatestRelease('miurahr', 'aqtinstall');
	const urls = [
		`https://github.com/miurahr/aqtinstall/releases/download/v${version}/aqt_x86.exe`,
		`https://github.com/miurahr/aqtinstall/releases/download/v${version}/aqt_x64.exe`,
	];

	return {
		version,
		urls,
	};
}
