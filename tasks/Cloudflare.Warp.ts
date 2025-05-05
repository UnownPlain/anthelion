import { updatePackage } from '../src/komac.ts';
import { validateString } from '../src/validate.ts';

export default async function () {
	const versionInfo = await fetch(
		'https://downloads.cloudflareclient.com/v1/update/json/windows/ga',
	).then((res) => res.json());

	const version = validateString(versionInfo.items[0].version).substring(2);
	const releaseDate = validateString(versionInfo.items[0].releaseDate).split(
		'T',
	)[0];
	const urls = [
		`https://downloads.cloudflareclient.com/v1/download/windows/version/${version}`,
	];

	await updatePackage(
		'Cloudflare.Warp',
		version,
		urls,
		'--release-notes-url',
		`https://developers.cloudflare.com/changelog/${releaseDate}-warp-ga-windows/`,
	);
}
