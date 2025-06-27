import ky from 'ky';
import { sortSemver } from '../src/helpers.ts';
import { validateString } from '../src/validate.ts';

export default async function () {
	const versionInfo = await ky(
		'https://gstreamer.freedesktop.org/data/pkg/windows/?C=M;O=D',
	).text();
	const regex = /href="(\d+\.\d*[02468](?:\.\d+)*)\/"/gi;
	const matches = versionInfo.matchAll(regex);
	const versions = sortSemver(
		Array.from(matches, (match) => match[1]).slice(0, 5),
	);

	const version = validateString(versions[0]);
	const urls = [
		`https://gstreamer.freedesktop.org/data/pkg/windows/${version}/msvc/gstreamer-1.0-msvc-x86-${version}.msi`,
		`https://gstreamer.freedesktop.org/data/pkg/windows/${version}/msvc/gstreamer-1.0-msvc-x86_64-${version}.msi`,
	];

	return {
		version,
		urls,
	};
}
