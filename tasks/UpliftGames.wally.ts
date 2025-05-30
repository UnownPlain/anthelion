import { getLatestRelease } from '../src/github.ts';

export default async function () {
	const version = await getLatestRelease('UpliftGames', 'wally');
	const urls = [
		`https://github.com/UpliftGames/wally/releases/download/v${version}/wally-v${version}-win64.zip`,
	];

	return {
		version,
		urls,
	};
}
