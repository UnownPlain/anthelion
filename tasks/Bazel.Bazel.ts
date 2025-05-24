import { getLatestRelease } from '../src/github.ts';

export default async function () {
	const version = await getLatestRelease('bazelbuild', 'bazel');
	const urls = [
		`https://github.com/bazelbuild/bazel/releases/download/${version}/bazel-${version}-windows-arm64.exe`,
		`https://github.com/bazelbuild/bazel/releases/download/${version}/bazel-${version}-windows-x86_64.exe`,
	];

	return {
		version,
		urls,
	};
}
