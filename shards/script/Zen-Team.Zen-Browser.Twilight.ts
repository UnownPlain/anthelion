import { getReleaseByTag } from '@/github.ts';
import { match } from '@/helpers.ts';
import { defineShard } from '@/schema/script-shard.ts';

export default defineShard(async () => {
	const release = await getReleaseByTag({
		owner: 'zen-browser',
		repo: 'desktop',
		tag: 'twilight-1',
	});
	const state = release.name;

	const version = match(state || '', /Twilight build - (\S+)/).groups[0];
	const urls = () => [
		{
			url: 'https://github.com/zen-browser/desktop/releases/download/twilight-1/zen.installer.exe',
			architecture: 'x64',
		},
		'https://github.com/zen-browser/desktop/releases/download/twilight-1/zen.installer-arm64.exe',
	];

	return {
		version,
		urls,
		replace: true,
		skipPrCheck: true,
		state,
	};
});
