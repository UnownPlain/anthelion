import { getAllReleases } from '@/github.ts';
import { vs } from '@/helpers.ts';

export default async function () {
	const releases = await getAllReleases('aptos-labs', 'aptos-core');
	const release = releases.find((r) => r.tag_name.includes('aptos-cli'));

	const version = vs(release?.tag_name.replace('aptos-cli-v', ''));
	const urls = [
		`https://github.com/aptos-labs/aptos-core/releases/download/aptos-cli-v${version}/aptos-cli-${version}-Windows-x86_64.zip`,
	];

	return {
		version,
		urls,
	};
}
