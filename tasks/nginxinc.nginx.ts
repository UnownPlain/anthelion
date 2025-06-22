import { matchAndValidate } from '../src/validate.ts';
import ky from 'ky';

export default async function () {
	const versionInfo = await ky('https://nginx.org/').text();
	const regex = /nginx[._-]v?(\d+(?:\.\d+)+)<\/a>[\s\S]*?mainline version/i;

	const version = matchAndValidate(versionInfo, regex)[1];
	const urls = [`https://nginx.org/download/nginx-${version}.zip|x64`];

	return {
		version,
		urls,
		args: ['--release-notes-url', 'https://nginx.org/en/CHANGES'],
	};
}
