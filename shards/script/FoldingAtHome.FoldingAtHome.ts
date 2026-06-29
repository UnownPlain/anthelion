import ky from 'ky';

import { defineShard } from '@/schema/script-shard.ts';

export default defineShard(async () => {
	const metadata = await ky(
		`https://download.foldingathome.org/releases/public/fah-client/meta.json`,
	).json<
		{
			project: string;
			worker: string;
			mode: string;
			package: string;
			version: string[];
		}[]
	>();
	const release = metadata.find(
		(item) =>
			item.project === 'fah-client' &&
			item.worker === 'windows-10-64bit' &&
			item.mode === 'release' &&
			item.package.endsWith('_AMD64.exe'),
	);

	if (!release) {
		throw new Error('Failed to find Windows x64 release in Folding@home metadata');
	}

	const version = release.version.join('.');

	return {
		version,
		urls: [`https://download.foldingathome.org/releases/public/fah-client/${release.package}`],
	};
});
