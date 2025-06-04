import { getLatestRelease } from '../src/github.ts';

export default async function () {
	const version = await getLatestRelease('ente-io', 'ente');
	const urls = [
		`https://github.com/ente-io/ente/releases/download/auth-v${version}/ente-auth-v${version}-installer.exe`,
		`https://github.com/ente-io/ente/releases/download/auth-v${version}/ente-auth-v${version}-windows.zip`,
	];

	return {
		version,
		urls,
	};
}
