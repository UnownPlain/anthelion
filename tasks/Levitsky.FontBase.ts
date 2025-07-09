import { electronBuilder } from '../src/helpers.ts';

export default async function () {
	const version = await electronBuilder(
		'https://releases.fontba.se/win/latest.yml',
	);
	const urls = [`https://releases.fontba.se/win/FontBase-${version}.exe|x64`];

	return {
		version,
		urls,
	};
}
