import { getLatestRelease } from '../src/github.ts';
import { updatePackage } from '../src/komac.ts';

export default async function () {
	const version = await getLatestRelease('caddyserver', 'caddy');
	const urls = [
		`https://github.com/caddyserver/caddy/releases/download/v${version}/caddy_${version}_windows_amd64.zip`,
		`https://github.com/caddyserver/caddy/releases/download/v${version}/caddy_${version}_windows_arm64.zip`,
	];

	await updatePackage('CaddyServer.Caddy', version, urls);
}
