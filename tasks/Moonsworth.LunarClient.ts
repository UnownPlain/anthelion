import { electronBuilder } from '../src/helpers.ts';

export default async function () {
	const version = await electronBuilder(
		'http://launcherupdates.lunarclientcdn.com/latest.yml',
	);
	const urls = [
		`https://launcherupdates.lunarclientcdn.com/Lunar%20Client%20v${version}.exe|neutral`,
	];

	return {
		version,
		urls,
	};
}
