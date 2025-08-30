import { getAllReleases } from '@/github.ts';
import { vs } from '@/helpers.ts';

export default async function () {
	const releases = await getAllReleases('oxc-project', 'oxc');
	const release = releases.find((r) => r.tag_name.startsWith('oxlint_v'));

	const version = vs(release?.tag_name.replace('oxlint_v', ''));
	const urls = [
		`https://github.com/oxc-project/oxc/releases/download/oxlint_v${version}/oxlint-win32-x64.exe`,
		`https://github.com/oxc-project/oxc/releases/download/oxlint_v${version}/oxlint-win32-arm64.exe`,
	];

	return {
		version,
		urls,
	};
}
