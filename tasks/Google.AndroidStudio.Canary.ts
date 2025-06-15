import { matchAndValidate } from '../src/validate.ts';

export default async function () {
	const response = await fetch('https://developer.android.com/studio/preview/');
	const versionInfo = await response.text();
	const regex =
		/agree_canary_win_bundle_download[\s\S]+?android-studio-([\d.]+)-windows\.exe/;

	const version = matchAndValidate(versionInfo, regex)[1];
	const urls = [
		`https://redirector.gvt1.com/edgedl/android/studio/install/${version}/android-studio-${version}-windows.exe`,
	];

	return {
		version,
		urls,
		args: ['--release-notes-url', 'https://androidstudio.googleblog.com/'],
	};
}
