import { getLatestRelease } from '../src/github.ts';
import { updatePackage } from '../src/komac.ts';

export default async function () {
	const version = await getLatestRelease('hashicorp', 'nomad');
	const urls = [
		`https://releases.hashicorp.com/nomad/${version}/nomad_${version}_windows_amd64.zip`,
	];

	await updatePackage('Hashicorp.Nomad', version, urls);
}
