import { getAllReleases } from '../src/github.ts';

export default async function () {
	const version = (await getAllReleases('oxc-project', 'oxc'))
		.filter((release) => release.tag_name.startsWith('oxlint_v'))[0]
		.tag_name.replace('oxlint_v', '');
	const urls = [
		`https://github.com/oxc-project/oxc/releases/download/oxlint_v${version}/oxlint-win32-x64.exe`,
		`https://github.com/oxc-project/oxc/releases/download/oxlint_v${version}/oxlint-win32-arm64.exe`,
	];

	return {
		version,
		urls,
	};
}
