import { electronBuilder } from '../src/helpers.ts';

export default async function () {
	const version = await electronBuilder(
		'https://app.tuta.com/desktop/latest.yml',
	);
	const urls = [
		`https://github.com/tutao/tutanota/releases/download/tutanota-desktop-release-${version}/tutanota-desktop-win.exe|x64`,
	];

	return {
		version,
		urls,
	};
}
