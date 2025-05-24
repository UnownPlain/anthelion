import { getLatestRelease } from '../src/github.ts';

export default async function () {
	const version = await getLatestRelease('bazelbuild', 'bazelisk');
	const urls = [
		`https://github.com/bazelbuild/bazelisk/releases/download/v${version}/bazelisk-windows-amd64.exe`,
		`https://github.com/bazelbuild/bazelisk/releases/download/v${version}/bazelisk-windows-arm64.exe`,
	];

	return {
		packageId: 'Bazel.Bazelisk',
		version,
		urls,
	};
}
