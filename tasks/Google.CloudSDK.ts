import { matchAndValidate } from '../src/validate.ts';
import ky from 'ky';

export default async function () {
	const versionInfo = await ky(
		'https://cloud.google.com/sdk/docs/install-sdk',
	).text();
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
