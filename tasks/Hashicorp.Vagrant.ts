import { getLatestRelease } from '../src/github.ts';
import { updatePackage } from '../src/komac.ts';

export default async function () {
	const version = await getLatestRelease('hashicorp', 'vagrant');
	const urls = [
		`https://releases.hashicorp.com/vagrant/${version}/vagrant_${version}_windows_i686.msi`,
		`https://releases.hashicorp.com/vagrant/${version}/vagrant_${version}_windows_amd64.msi`,
	];

	await updatePackage('Hashicorp.Vagrant', version, urls);
}
