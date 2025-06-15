import { matchAndValidate } from '../src/validate.ts';

export default async function () {
	const response = await fetch('https://cloud.google.com/sdk/docs/install-sdk');
	const versionInfo = await response.text();
	const regex = /latest\s*gcloud\s*CLI\s*version\s*\(v?(\d+(?:\.\d+)+)\)/i;

	const version = matchAndValidate(versionInfo, regex)[1];
	const urls = [
		'https://dl.google.com/dl/cloudsdk/channels/rapid/GoogleCloudSDKInstaller.exe',
	];

	return {
		version,
		urls,
		args: ['-r'],
	};
}
