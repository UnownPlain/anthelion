import { getLatestRelease } from '../src/github.ts';

export default async function () {
	const version = await getLatestRelease('librespeed', 'speedtest-cli');
	const urls = [
		`https://github.com/librespeed/speedtest-cli/releases/download/v${version}/librespeed-cli_${version}_windows_386.zip`,
		`https://github.com/librespeed/speedtest-cli/releases/download/v${version}/librespeed-cli_${version}_windows_amd64.zip`,
		`https://github.com/librespeed/speedtest-cli/releases/download/v${version}/librespeed-cli_${version}_windows_arm64.zip`,
	];

	return {
		version,
		urls,
	};
}
