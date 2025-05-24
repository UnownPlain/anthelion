import { electronBuilder } from '../src/helpers.ts';

export default async function () {
	const response = await fetch('https://releases.fontba.se/win/latest.yml');
	const versionInfo = await response.text();

	const version = electronBuilder(versionInfo);
	const urls = [`https://releases.fontba.se/win/FontBase-${version}.exe`];

	return {
		packageId: 'Levitsky.FontBase',
		version,
		urls,
	};
}
