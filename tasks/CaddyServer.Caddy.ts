import { getLatestRelease } from '../src/github.ts';

export default async function () {
	const version = await getLatestRelease('caddyserver', 'caddy');
	const urls = [
		`https://github.com/caddyserver/caddy/releases/download/v${version}/caddy_${version}_windows_amd64.zip`,
		`https://github.com/caddyserver/caddy/releases/download/v${version}/caddy_${version}_windows_arm64.zip`,
	];

	return {
		packageId: 'CaddyServer.Caddy',
		version,
		urls,
	};
}
