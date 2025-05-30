import { validateMatch } from '../src/validate.ts';

export default async function () {
	const response = await fetch(
		'https://gstreamer.freedesktop.org/src/gstreamer/?C=M;O=D',
	);
	const versionInfo = await response.text();
	const match = versionInfo.match(
		/href=.*?gstreamer[._-]v?(\d+\.\d*[02468](?:\.\d+)*)\.t/i,
	);

	const version = validateMatch(match)[1];
	const urls = [
		`https://gstreamer.freedesktop.org/data/pkg/windows/${version}/msvc/gstreamer-1.0-msvc-x86-${version}.msi`,
		`https://gstreamer.freedesktop.org/data/pkg/windows/${version}/msvc/gstreamer-1.0-msvc-x86_64-${version}.msi`,
	];

	return {
		version,
		urls,
	};
}
