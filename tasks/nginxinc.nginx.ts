import { pageMatch } from '../src/helpers.ts';

export default async function () {
	const version = await pageMatch(
		'https://nginx.org/',
		/nginx[._-]v?(\d+(?:\.\d+)+)<\/a>[\s\S]*?mainline version/i,
	);
	const urls = [`https://nginx.org/download/nginx-${version}.zip|x64`];

	return {
		version,
		urls,
		args: ['--release-notes-url', 'https://nginx.org/en/CHANGES'],
	};
}
