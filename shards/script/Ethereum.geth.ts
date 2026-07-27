import { defineShard } from '@/schema/script-shard.ts';
import { pageMatch } from '@/strategies.ts';

export default defineShard(async () => {
	const { version: versionWithHash } = await pageMatch(
		'https://geth.ethereum.org/downloads',
		/ href=.[^"' >]*geth-windows-amd64-(\d+\.\d+\.\d+-[0-9a-f]{8})\.exe/i,
	);

	const version = versionWithHash.slice(0, -9);
	const urls = () => [
		`https://gethstore.blob.core.windows.net/builds/geth-windows-amd64-${versionWithHash}.exe`,
	];

	return {
		version,
		urls,
	};
});
