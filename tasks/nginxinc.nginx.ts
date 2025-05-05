import { updatePackage } from '../src/komac.ts';
import { validateMatch } from '../src/validate.ts';

export default async function () {
	const versionInfo = await fetch('https://nginx.org/').then((res) =>
		res.text()
	);

	const match = versionInfo.match(
		/nginx[._-]v?(\d+(?:\.\d+)+)<\/a>[\s\S]*?mainline version/i,
	);

	const version = validateMatch(match)[1];
	const urls = [`https://nginx.org/download/nginx-${version}.zip`];

	await updatePackage(
		'nginxinc.nginx',
		version,
		urls,
		'--release-notes-url',
		'https://nginx.org/en/CHANGES',
	);
}
