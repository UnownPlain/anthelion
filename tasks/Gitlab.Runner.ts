import { validateString } from '../src/validate.ts';

export default async function () {
	const response = await fetch(
		'https://gitlab.com/api/v4/projects/gitlab-org%2Fgitlab-runner/releases',
	);
	const versionInfo = await response.json();

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
