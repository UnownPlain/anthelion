import { getLatestRelease } from '../src/github.ts';
import { updatePackage } from '../src/komac.ts';

export default async function () {
	const version = await getLatestRelease('feather-wallet', 'feather');
	const urls = [
		`https://github.com/feather-wallet/feather/releases/download/${version}/FeatherWalletSetup-${version}.exe`,
	];

	await updatePackage('FeatherWallet.Feather', version, urls);
}
