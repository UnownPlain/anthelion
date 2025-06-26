import { pageMatch } from '../src/helpers.ts';

export default async function () {
	const version = await pageMatch(
		'https://cloud.google.com/sdk/docs/install-sdk',
		/latest\s*gcloud\s*CLI\s*version\s*\(v?(\d+(?:\.\d+)+)\)/i,
	);
	const urls = [
		'https://dl.google.com/dl/cloudsdk/channels/rapid/GoogleCloudSDKInstaller.exe',
	];

	return {
		version,
		urls,
		args: ['-r'],
	};
}
