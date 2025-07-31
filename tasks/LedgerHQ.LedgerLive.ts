import { electronBuilder } from '../src/helpers.ts';

export default async function () {
	// API blocks fetch requests from Bun specifically for whatever reason
	const version = await electronBuilder(
		'https://corsproxy.io/?url=https://download.live.ledger.com/latest.yml',
	);
	const urls = [
		`https://download.live.ledger.com/ledger-live-desktop-${version}-win-x64.exe`,
	];

	return {
		version,
		urls,
	};
}
