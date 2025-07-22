import { electronBuilder } from '../src/helpers.ts';

export default async function () {
	const version = await electronBuilder(
		'https://github.com/kopia/kopia/releases/latest/download/latest.yml',
	);
	const urls = [
		`https://github.com/kopia/kopia/releases/download/v${version}/KopiaUI-Setup-${version}.exe|x64`,
	];

	return {
		version,
		urls,
	};
}
