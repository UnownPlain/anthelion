import { getLatestRelease } from '../src/github.ts';

export default async function () {
	const version = await getLatestRelease('zerotier', 'ZeroTierOne');
	const urls = [
		`https://download.zerotier.com/RELEASES/${version}/dist/ZeroTier%20One.msi`,
	];

	return {
		packageId: 'ZeroTier.ZeroTierOne',
		version,
		urls,
	};
}
