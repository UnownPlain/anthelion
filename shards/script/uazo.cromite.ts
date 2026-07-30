import { defineShard } from '@/schema/script-shard.ts';
import { pageMatch } from '@/strategies.ts';

export default defineShard(async () => {
	const {
		groups: [version, commit],
	} = await pageMatch({
		url: 'https://github.com/uazo/cromite/releases/latest/download/updateurl.txt',
		regex: /version=([\d.]+).*?commit=([a-f0-9]+)/,
	});
	const urls = () => [
		{
			url: `https://github.com/uazo/cromite/releases/download/v${version}-${commit}/chrome-win.zip`,
			architecture: 'x64',
		},
	];

	return {
		version,
		urls,
	};
});
