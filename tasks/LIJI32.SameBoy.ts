import { getLatestRelease } from '../src/github.ts';

export default async function () {
	const version = await getLatestRelease('LIJI32', 'SameBoy');
	const urls = [
		`https://github.com/LIJI32/SameBoy/releases/download/v${version}/sameboy_winsdl_v${version}.zip`,
	];

	return {
		version,
		urls,
	};
}
