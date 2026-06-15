import ky from 'ky';

export default async function () {
	const release = await ky('https://desktop-downloads.kraken.com/latest.json').json<{
		version: string;
		revision: string;
	}>();

	const version = release.version;
	const urls = () => [
		`https://desktop-downloads.kraken.com/${release.revision}/KrakenDesktopInstaller.msi`,
	];

	return {
		version,
		urls,
	};
}
