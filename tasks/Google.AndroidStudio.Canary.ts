import { updatePackage } from '../src/komac.ts';
import { validateMatch } from '../src/validate.ts';

export default async function () {
	const versionInfo = await fetch(
		'https://developer.android.com/studio/preview/',
	).then((res) => res.text());

	const match = versionInfo.match(
		'agree_canary_win_bundle_download[\\s\\S]+?android-studio-([\\d.]+)-windows\\.exe',
	);
	const version = validateMatch(match)[1];

	const urls = [
		`https://redirector.gvt1.com/edgedl/android/studio/install/${version}/android-studio-${version}-windows.exe`,
	];

	await updatePackage(
		'Google.AndroidStudio.Canary',
		version,
		urls,
		'--release-notes-url',
		'https://androidstudio.googleblog.com/',
	);
}
