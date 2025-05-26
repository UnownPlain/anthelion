import { electronBuilder } from '../src/helpers.ts';

export default async function () {
	const version = await electronBuilder(
		'https://github.com/kopia/kopia/releases/latest/download/latest.yml',
	);
	const urls = [
		`https://github.com/kopia/kopia/releases/download/v${version}/kopia-${version}-windows-x64.zip`,
	];

	return {
		version,
		urls,
	};
}
