import { getLatestRelease } from '../src/github.ts';
import { updatePackage } from '../src/komac.ts';

export default async function () {
	const version = await getLatestRelease('go-acme', 'lego');
	const urls = [
		`https://github.com/go-acme/lego/releases/download/v${version}/lego_v${version}_windows_386.zip`,
		`https://github.com/go-acme/lego/releases/download/v${version}/lego_v${version}_windows_amd64.zip`,
		`https://github.com/go-acme/lego/releases/download/v${version}/lego_v${version}_windows_armv7.zip`,
		`https://github.com/go-acme/lego/releases/download/v${version}/lego_v${version}_windows_arm64.zip`,
	];

	await updatePackage('GoACME.lego', version, urls);
}
