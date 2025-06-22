import { matchAndValidate } from '../src/validate.ts';
import ky from 'ky';

export default async function () {
	const versionInfo = await ky
		.get('https://developer.android.com/studio/')
		.text();
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
