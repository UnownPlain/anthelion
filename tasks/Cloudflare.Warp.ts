import { validateString } from '../src/validate.ts';

export default async function () {
	const response = await fetch(
		'https://downloads.cloudflareclient.com/v1/update/json/windows/ga',
	);
	const versionInfo = await response.json();

	const version = validateString(versionInfo.items[0].version);
	const urls = [
		`https://downloads.cloudflareclient.com/v1/download/windows/version/${version}`,
	];

	return {
		version: version.substring(2),
		urls,
		args: [
			'--release-notes-url',
			`https://developers.cloudflare.com/cloudflare-one/changelog/warp/#${version}`,
		],
	};
}
