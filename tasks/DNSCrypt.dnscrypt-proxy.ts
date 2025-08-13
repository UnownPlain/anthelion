import { getLatestRelease } from '../src/github.ts';

export default async function () {
	const version = await getLatestRelease('DNSCrypt', 'dnscrypt-proxy');
	const urls = [
		`https://github.com/DNSCrypt/dnscrypt-proxy/releases/download/${version}/dnscrypt-proxy-win32-${version}.zip`,
		`https://github.com/DNSCrypt/dnscrypt-proxy/releases/download/${version}/dnscrypt-proxy-win64-${version}.zip`,
		`https://github.com/DNSCrypt/dnscrypt-proxy/releases/download/${version}/dnscrypt-proxy-winarm-${version}.zip`,
		`https://github.com/DNSCrypt/dnscrypt-proxy/releases/download/${version}/dnscrypt-proxy-x64-${version}.msi`,
		`https://github.com/DNSCrypt/dnscrypt-proxy/releases/download/${version}/dnscrypt-proxy-x86-${version}.msi`,
	];

	return {
		version,
		urls,
	};
}
