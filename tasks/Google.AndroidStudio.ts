import { matchAndValidate } from '../src/validate.ts';

export default async function () {
	const response = await fetch('https://developer.android.com/studio/');
	const versionInfo = await response.text();
	const regex = /android[._-]studio[._-]v?(\d+(?:\.\d+)+)[._-]windows\.exe/i;

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
