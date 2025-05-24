import { validateMatch } from '../src/validate.ts';

export default async function () {
	const response = await fetch('https://nginx.org/');
	const versionInfo = await response.text();
	const match = versionInfo.match(
		/nginx[._-]v?(\d+(?:\.\d+)+)<\/a>[\s\S]*?mainline version/i,
	);

	const version = validateMatch(match)[1];
	const urls = [`https://nginx.org/download/nginx-${version}.zip|x64`];

	return {
		packageId: 'nginxinc.nginx',
		version,
		urls,
		args: ['--release-notes-url', 'https://nginx.org/en/CHANGES'],
	};
}
