import { validateString } from '../src/validate.ts';
import ky from 'ky';

export default async function () {
	const versionInfo = (await ky(
		'https://gitlab.com/api/v4/projects/gitlab-org%2Fcli/releases',
	).json()) as Array<{ tag_name: string }>;

	const version = validateString(versionInfo[0].tag_name.substring(1));
	const urls = [
		`https://gitlab.com/gitlab-org/cli/-/releases/v${version}/downloads/glab_${version}_Windows_x86_64_installer.exe`,
	];

	return {
		version,
		urls,
	};
}
