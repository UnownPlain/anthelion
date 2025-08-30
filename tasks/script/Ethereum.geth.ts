import { pageMatch } from '@/strategies.ts';

export default async function () {
	const version = await pageMatch(
		'https://geth.ethereum.org/downloads',
		/ href=.[^"' >]*geth-windows-amd64-(\d+\.\d+\.\d+-[0-9a-f]{8})\.exe/i,
	);
	const urls = [
		`https://gethstore.blob.core.windows.net/builds/geth-windows-amd64-${version}.exe`,
	];

	return {
		version: version.slice(0, -9),
		urls,
	};
}
