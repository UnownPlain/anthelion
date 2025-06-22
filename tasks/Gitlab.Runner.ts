import { validateString } from '../src/validate.ts';
import ky from 'ky';

export default async function () {
	const versionInfo = (await ky(
		'https://gitlab.com/api/v4/projects/gitlab-org%2Fgitlab-runner/releases',
	).json()) as Array<{ tag_name: string }>;

	const version = validateString(versionInfo[0].tag_name.substring(1));
	const urls = [
		`https://gitlab-runner-downloads.s3.amazonaws.com/v${version}/binaries/gitlab-runner-windows-386.exe`,
		`https://gitlab-runner-downloads.s3.amazonaws.com/v${version}/binaries/gitlab-runner-windows-amd64.exe`,
	];

	return {
		version,
		urls,
	};
}
