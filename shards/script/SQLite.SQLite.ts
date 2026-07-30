import { defineShard } from '@/schema/script-shard.ts';
import { pageMatch } from '@/strategies.ts';

export default defineShard(async () => {
	const {
		groups: [version, year, encodedVersion],
	} = await pageMatch({
		url: 'https://www.sqlite.org/download.html',
		regex: /DLL for Windows x64, SQLite version ([\d.]+)\..*?(\d+)\/sqlite-tools-win-x64-(\d+)/ms,
	});
	const urls = () => [
		`https://www.sqlite.org/${year}/sqlite-tools-win-x64-${encodedVersion}.zip`,
		`https://www.sqlite.org/${year}/sqlite-tools-win-arm64-${encodedVersion}.zip`,
	];

	return {
		version,
		urls,
	};
});
