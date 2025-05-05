import { getLatestRelease } from '../src/github.ts';
import { updatePackage } from '../src/komac.ts';

export default async function () {
	const version = await getLatestRelease('zerotier', 'ZeroTierOne');
	const urls = [
		`https://download.zerotier.com/RELEASES/${version}/dist/ZeroTier%20One.msi`,
	];

	await updatePackage('ZeroTier.ZeroTierOne', version, urls);
}
