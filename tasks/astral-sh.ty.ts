import { getLatestPreRelease } from '../src/github.ts';

export default async function () {
	const version = await getLatestPreRelease('astral-sh', 'ty');
	const urls = [
		`https://github.com/astral-sh/ty/releases/download/${version}/ty-i686-pc-windows-msvc.zip`,
		`https://github.com/astral-sh/ty/releases/download/${version}/ty-x86_64-pc-windows-msvc.zip`,
		`https://github.com/astral-sh/ty/releases/download/${version}/ty-aarch64-pc-windows-msvc.zip`,
	];

	return {
		version,
		urls,
	};
}
