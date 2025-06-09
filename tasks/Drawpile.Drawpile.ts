import { getLatestRelease } from '../src/github.ts';

export default async function () {
	const version = await getLatestRelease('drawpile', 'Drawpile');
	const urls = [
		`https://github.com/drawpile/Drawpile/releases/download/${version}/Drawpile-${version}-x86.msi`,
		`https://github.com/drawpile/Drawpile/releases/download/${version}/Drawpile-${version}-x86_64.msi`,
	];

	return {
		version,
		urls,
	};
}
