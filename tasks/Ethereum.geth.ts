import { getLatestRelease, getTagHash } from '../src/github.ts';
import { updatePackage } from '../src/komac.ts';

export default async function () {
	const version = await getLatestRelease('ethereum', 'go-ethereum');
	const commit = (await getTagHash('ethereum', 'go-ethereum')).substring(0, 8);

	const urls = [
		`https://gethstore.blob.core.windows.net/builds/geth-windows-amd64-${version}-${commit}.exe`,
	];

	await updatePackage('Ethereum.geth', version, urls);
}
