import { getLatestRelease } from '../src/github.ts';
import { updatePackage } from '../src/komac.ts';

export default async function () {
	const version = await getLatestRelease('bazelbuild', 'bazelisk');
	const urls = [
		`https://github.com/bazelbuild/bazelisk/releases/download/v${version}/bazelisk-windows-amd64.exe`,
		`https://github.com/bazelbuild/bazelisk/releases/download/v${version}/bazelisk-windows-arm64.exe`,
	];

	await updatePackage('Bazel.Bazelisk', version, urls);
}
