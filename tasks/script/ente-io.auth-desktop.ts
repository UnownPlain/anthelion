import { getAllReleases } from '@/github.ts';
import { vs } from '@/helpers.ts';

export default async function () {
	const releases = await getAllReleases('ente-io', 'ente');

	const release = releases.find((r) => r.tag_name.includes('auth'));
	const version = vs(release?.tag_name.replace('auth-v', ''));

	const urls = [
		`https://github.com/ente-io/ente/releases/download/auth-v${version}/ente-auth-v${version}-installer.exe`,
		`https://github.com/ente-io/ente/releases/download/auth-v${version}/ente-auth-v${version}-windows.zip`,
	];

	return {
		version,
		urls,
	};
}
