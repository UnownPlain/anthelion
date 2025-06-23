import { getAllReleases } from '../src/github.ts';

export default async function () {
	const versionInfo = await getAllReleases('ente-io', 'ente');
	const version = versionInfo
		.filter((release) => release.tag_name.includes('auth'))[0]
		.tag_name.substring(6);

	const urls = [
		`https://github.com/ente-io/ente/releases/download/auth-v${version}/ente-auth-v${version}-installer.exe`,
		`https://github.com/ente-io/ente/releases/download/auth-v${version}/ente-auth-v${version}-windows.zip`,
	];

	return {
		version,
		urls,
	};
}
