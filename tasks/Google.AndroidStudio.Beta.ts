import { pageMatch } from '../src/helpers.ts';

export default async function () {
	const version = await pageMatch(
		'https://developer.android.com/studio/preview/',
		/agree_beta_win_bundle_download[\s\S]+?android-studio-([\d.]+)-windows\.exe/i,
	);
	const urls = [
		`https://redirector.gvt1.com/edgedl/android/studio/install/${version}/android-studio-${version}-windows.exe`,
	];

	return {
		version,
		urls,
		args: ['--release-notes-url', 'https://androidstudio.googleblog.com/'],
	};
}
