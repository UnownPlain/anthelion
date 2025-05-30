import { electronBuilder } from '../src/helpers.ts';

export default async function () {
	const version = await electronBuilder(
		'https://github.com/usebruno/bruno/releases/latest/download/latest.yml',
	);
	const urls = [
		`https://github.com/usebruno/bruno/releases/download/v${version}/bruno_${version}_x64_win.exe`,
		`https://github.com/usebruno/bruno/releases/download/v${version}/bruno_${version}_x64_win.zip`,
	];

	return {
		version,
		urls,
	};
}
