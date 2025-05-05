import { getLatestRelease } from '../src/github.ts';
import { updatePackage } from '../src/komac.ts';

export default async function () {
	const version = await getLatestRelease('hashicorp', 'boundary');
	const urls = [
		`https://releases.hashicorp.com/boundary/${version}/boundary_${version}_windows_386.zip`,
		`https://releases.hashicorp.com/boundary/${version}/boundary_${version}_windows_amd64.zip`,
	];

	await updatePackage('Hashicorp.Boundary', version, urls);
}
