import { getLatestRelease } from '../src/github.ts';

export default async function () {
	const version = await getLatestRelease('feather-wallet', 'feather');
	const urls = [
		`https://github.com/feather-wallet/feather/releases/download/${version}/FeatherWalletSetup-${version}.exe`,
	];

	return {
		packageId: 'FeatherWallet.Feather',
		version,
		urls,
	};
}
