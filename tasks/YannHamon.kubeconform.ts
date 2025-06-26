import { getLatestRelease } from '../src/github.ts';

export default async function () {
	const version = await getLatestRelease('yannh', 'kubeconform');
	const urls = [
		`https://github.com/yannh/kubeconform/releases/download/v${version}/kubeconform-windows-amd64.zip`,
		`https://github.com/yannh/kubeconform/releases/download/v${version}/kubeconform-windows-armv6.zip`,
		`https://github.com/yannh/kubeconform/releases/download/v${version}/kubeconform-windows-arm64.zip`,
	];

	return {
		version,
		urls,
	};
}
