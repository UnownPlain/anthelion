import { updatePackage } from '../src/komac.ts';
import { validateMatch } from '../src/validate.ts';

export default async function () {
	const versionInfo = await fetch(
		'https://cloud.google.com/sdk/docs/install-sdk',
	).then((res) => res.text());

	const match = versionInfo.match(
		/latest\s*gcloud\s*CLI\s*version\s*\(v?(\d+(?:\.\d+)+)\)/i,
	);
	const version = validateMatch(match)[1];

	const urls = [
		`https://dl.google.com/dl/cloudsdk/channels/rapid/GoogleCloudSDKInstaller.exe`,
	];

	await updatePackage('Google.CloudSDK', version, urls, '-r');
}
