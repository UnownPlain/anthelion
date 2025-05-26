import { electronBuilder } from '../src/helpers.ts';

export default async function () {
	const version = await electronBuilder(
		'https://download.live.ledger.com/latest.yml',
	);
	const urls = [
		`https://download.live.ledger.com/ledger-live-desktop-${version}-win-x64.exe`,
	];

	return {
		version,
		urls,
	};
}
