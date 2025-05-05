import { updatePackage } from '../src/komac.ts';
import { validateMatch } from '../src/validate.ts';

export default async function () {
	const versionInfo = await fetch('https://developer.android.com/studio/').then(
		(res) => res.text(),
	);

	const match = versionInfo.match(
		/android[._-]studio[._-]v?(\d+(?:\.\d+)+)[._-]windows\.exe/i,
	);
	const version = validateMatch(match)[1];

	const urls = [
		`https://redirector.gvt1.com/edgedl/android/studio/install/${version}/android-studio-${version}-windows.exe`,
	];

	await updatePackage(
		'Google.AndroidStudio',
		version,
		urls,
		'--release-notes-url',
		'https://androidstudio.googleblog.com/',
	);
}
