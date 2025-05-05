import { electronBuilder } from '../src/helpers.ts';
import { updatePackage } from '../src/komac.ts';

export default async function () {
	const versionInfo = await fetch(
		'https://download.live.ledger.com/latest.yml',
	).then((res) => res.text());

	const version = electronBuilder(versionInfo);
	const urls = [
		`https://download.live.ledger.com/ledger-live-desktop-${version}-win-x64.exe`,
	];

	await updatePackage('LedgerHQ.LedgerLive', version, urls);
}
