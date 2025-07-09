import { redirectMatch } from '../src/helpers.ts';

export default async function () {
	const { version, url } = await redirectMatch(
		'https://api-gw.uid.alpha.ui.com/location/api/v1/public/fw/download/latest/?app=DESKTOP-IDENTITY-STANDARD-WINDOWS-MSI',
		/[a-f0-9]+-windows-(\d+(?:\.\d+)+)-[a-f0-9-]+\.msi/i,
	);

	return {
		version,
		urls: [url],
	};
}
