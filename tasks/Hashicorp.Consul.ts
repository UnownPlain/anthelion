import { getLatestRelease } from '../src/github.ts';
import { updatePackage } from '../src/komac.ts';

export default async function () {
	const version = await getLatestRelease('hashicorp', 'consul');
	const urls = [
		`https://releases.hashicorp.com/consul/${version}/consul_${version}_windows_386.zip`,
		`https://releases.hashicorp.com/consul/${version}/consul_${version}_windows_amd64.zip`,
	];

	await updatePackage('Hashicorp.Consul', version, urls);
}
