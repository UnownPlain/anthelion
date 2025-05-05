import { updatePackage } from '../src/komac.ts';
import { electronBuilder } from '../src/helpers.ts';

export default async function () {
	const versionInfo = await fetch(
		'https://releases.fontba.se/win/latest.yml',
	).then((res) => res.text());

	const version = electronBuilder(versionInfo);
	const urls = [`https://releases.fontba.se/win/FontBase-${version}.exe`];

	await updatePackage('Levitsky.FontBase', version, urls);
}
