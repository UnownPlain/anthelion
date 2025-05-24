import { getAllReleases } from '../src/github.ts';

export default async function () {
	const versionInfo = await getAllReleases('aptos-labs', 'aptos-core');

	const version = versionInfo
		.filter((release) => release.tag_name.includes('aptos-cli'))[0]
		.tag_name.substring(11);
	const urls = [
		`https://github.com/aptos-labs/aptos-core/releases/download/aptos-cli-v${version}/aptos-cli-${version}-Windows-x86_64.zip`,
	];

	return {
		packageId: 'AptosCore.aptos',
		version,
		urls,
	};
}
