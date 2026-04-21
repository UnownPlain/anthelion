import { getAllReleases } from '@/github.ts';
import { match } from '@/helpers.ts';

export default async function () {
	const owner = 'oxc-project';
	const repo = 'oxc';

	const releases = await getAllReleases(owner, repo);
	const release = releases.find((entry) => entry.tag_name.startsWith('apps_v'));

	const [version] = match(release?.name ?? '', /oxfmt v(\d+(?:\.\d+)+)/i);
	const urls = [
		`https://github.com/oxc-project/oxc/releases/download/${release?.tag_name}/oxfmt-i686-pc-windows-msvc.zip`,
		`https://github.com/oxc-project/oxc/releases/download/${release?.tag_name}/oxfmt-x86_64-pc-windows-msvc.zip`,
		`https://github.com/oxc-project/oxc/releases/download/${release?.tag_name}/oxfmt-aarch64-pc-windows-msvc.zip`,
	];

	return {
		version,
		urls,
		releaseNotes: {
			source: 'github',
			owner,
			repo,
			tag: release?.tag_name,
			cleanup: true,
		},
	};
}
