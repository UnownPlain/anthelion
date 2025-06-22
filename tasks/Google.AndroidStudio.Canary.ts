import { matchAndValidate } from '../src/validate.ts';
import ky from 'ky';

export default async function () {
	const versionInfo = await ky(
		'https://developer.android.com/studio/preview/',
	).text();
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
