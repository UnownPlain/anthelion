import { validateMatch } from '../src/validate.ts';

export default async function () {
	const response = await fetch('https://developer.android.com/studio/');
	const versionInfo = await response.text();
	const match = versionInfo.match(
		/android[._-]studio[._-]v?(\d+(?:\.\d+)+)[._-]windows\.exe/i,
	);

	const version = validateMatch(match)[1];
	const urls = [
		`https://redirector.gvt1.com/edgedl/android/studio/install/${version}/android-studio-${version}-windows.exe`,
	];

	return {
		packageId: 'Google.AndroidStudio',
		version,
		urls,
		args: ['--release-notes-url', 'https://androidstudio.googleblog.com/'],
	};
}
