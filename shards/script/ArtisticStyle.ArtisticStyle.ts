import { defineShard } from '@/schema/script-shard.ts';
import { pageMatch } from '@/strategies.ts';

export default defineShard(async () => {
	const { version } = await pageMatch({
		url: 'https://sourceforge.net/projects/astyle/rss?path=/astyle',
		regex: /astyle[._-]v?(\d+(?:\.\d+)+)[._-]/,
	});
	const urls = () => {
		const pathVersion = version?.split('.').slice(0, -1).join('.');
		return [
			`https://sourceforge.net/projects/astyle/files/astyle/astyle%20${pathVersion}/astyle-${version}.zip/download`,
			`https://sourceforge.net/projects/astyle/files/astyle/astyle%20${pathVersion}/astyle-${version}-x64.zip/download`,
		];
	};

	return {
		version,
		urls,
	};
});
