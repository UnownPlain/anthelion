import ky from 'ky';

import { match } from '@/helpers.ts';
import { defineShard } from '@/schema/script-shard.ts';

export default defineShard(async () => {
	const response = await ky(
		'https://github.com/uazo/cromite/releases/latest/download/updateurl.txt',
	).text();

	const [version, commit] = match(response, /version=([\d.]+).*?commit=([a-f0-9]+)/);

	const urls = () => [
		`https://github.com/uazo/cromite/releases/download/v${version}-${commit}/chrome-win.zip|x64`,
	];

	return {
		version,
		urls,
	};
});
