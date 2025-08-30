import ky from 'ky';
import { sortSemver, expect } from '@/helpers.ts';
import { vs } from '@/helpers.ts';

export default async function () {
	const versionInfo = await ky(
		'https://gstreamer.freedesktop.org/data/pkg/windows/?C=M;O=D',
	).text();
	const regex = /href="(\d+\.\d*[02468](?:\.\d+)*)\/"/gi;
	const matches = versionInfo.matchAll(regex);
	const versions = sortSemver(
		Array.from(matches, (match) => vs(match[1])).slice(0, 5),
	);

	const version = vs(expect(versions[0], 'No gstreamer versions found'));
	const urls = [
		`https://gstreamer.freedesktop.org/data/pkg/windows/${version}/msvc/gstreamer-1.0-msvc-x86-${version}.msi`,
		`https://gstreamer.freedesktop.org/data/pkg/windows/${version}/msvc/gstreamer-1.0-msvc-x86_64-${version}.msi`,
	];

	return {
		version,
		urls,
	};
}
