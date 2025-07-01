import { pageMatch } from '../src/helpers.ts';

export default async function () {
	const version = await pageMatch(
		'https://ziglang.org/download/',
		/href=.*?zig[._-]v?(\d+(?:\.\d+)+)\.t/i,
	);
	const urls = [
		`https://ziglang.org/download/${version}/zig-x86-windows-${version}.zip`,
		`https://ziglang.org/download/${version}/zig-x86_64-windows-${version}.zip`,
		`https://ziglang.org/download/${version}/zig-aarch64-windows-${version}.zip`,
	];

	return {
		version,
		urls,
	};
}
