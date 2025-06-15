import { matchAndValidate } from '../src/validate.ts';

export default async function () {
	const response = await fetch('https://nginx.org/');
	const versionInfo = await response.text();
	const regex = /nginx[._-]v?(\d+(?:\.\d+)+)<\/a>[\s\S]*?mainline version/i;

	const version = matchAndValidate(versionInfo, regex)[1];
	const urls = [`https://nginx.org/download/nginx-${version}.zip|x64`];

	return {
		version,
		urls,
		args: ['--release-notes-url', 'https://nginx.org/en/CHANGES'],
	};
}
