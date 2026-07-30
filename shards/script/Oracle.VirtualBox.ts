import { defineShard } from '@/schema/script-shard.ts';
import { pageMatch } from '@/strategies.ts';

export default defineShard(async () => {
	const {
		groups: [version, version2],
	} = await pageMatch({
		url: 'https://www.virtualbox.org/wiki/Downloads',
		regex: /href=.*?VirtualBox[._-]v?(\d+(?:\.\d+)*[a-z]?)[._-](\d+)[._-]Win\.exe/i,
	});
	const urls = () => [
		{
			url: `https://download.virtualbox.org/virtualbox/${version}/VirtualBox-${version}-${version2}-Win.exe`,
			architecture: 'x64',
		},
	];

	return {
		version,
		urls,
	};
});
