import { getLatestRelease } from '../src/github.ts';

export default async function () {
	const version = await getLatestRelease('yggdrasil-network', 'yggdrasil-go');
	const urls = [
		`https://github.com/yggdrasil-network/yggdrasil-go/releases/download/v${version}/yggdrasil-${version}-x86.msi`,
		`https://github.com/yggdrasil-network/yggdrasil-go/releases/download/v${version}/yggdrasil-${version}-x64.msi`,
		`https://github.com/yggdrasil-network/yggdrasil-go/releases/download/v${version}/yggdrasil-${version}-arm.msi`,
		`https://github.com/yggdrasil-network/yggdrasil-go/releases/download/v${version}/yggdrasil-${version}-arm64.msi`,
	];

	return {
		version,
		urls,
	};
}
