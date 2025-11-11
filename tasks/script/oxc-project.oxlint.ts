import { getAllReleases } from '@/github.ts';
import { vs } from '@/helpers.ts';

export default async function () {
	const releases = await getAllReleases('oxc-project', 'oxc');
	const release = releases.find((r) => r.tag_name.startsWith('apps_v'));
	const version = vs(release?.tag_name.replace('apps_v', ''));

	const urls = [
		`https://github.com/oxc-project/oxc/releases/download/apps_v${version}/oxlint-win32-x64.zip`,
		`https://github.com/oxc-project/oxc/releases/download/apps_v${version}/oxlint-win32-arm64.zip`,
	];

	return {
		version,
		urls,
	};
}
