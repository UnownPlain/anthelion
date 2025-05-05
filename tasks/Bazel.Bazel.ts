import { getLatestRelease } from '../src/github.ts';
import { updatePackage } from '../src/komac.ts';

export default async function () {
	const version = await getLatestRelease('bazelbuild', 'bazel');
	const urls = [
		`https://github.com/bazelbuild/bazel/releases/download/${version}/bazel-${version}-windows-arm64.exe`,
		`https://github.com/bazelbuild/bazel/releases/download/${version}/bazel-${version}-windows-x86_64.exe`,
	];

	await updatePackage('Bazel.Bazel', version, urls);
}
