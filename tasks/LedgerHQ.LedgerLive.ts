import { electronBuilder } from '../src/helpers.ts';

export default async function () {
	const response = await fetch('https://download.live.ledger.com/latest.yml');
	const versionInfo = await response.text();

	const version = electronBuilder(versionInfo);
	const urls = [
		`https://download.live.ledger.com/ledger-live-desktop-${version}-win-x64.exe`,
	];

	return {
		packageId: 'LedgerHQ.LedgerLive',
		version,
		urls,
	};
}
