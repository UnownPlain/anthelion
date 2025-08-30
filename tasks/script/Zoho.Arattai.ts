import { matchAndValidate, vs } from '@/helpers.ts';
import ky from 'ky';

export default async function () {
	const releases = await ky(
		'https://downloads.zohocdn.com/arattai-desktop/artifacts.json',
	).json<{ windows: { '32bit': string; '64bit': string } }>();

	const urls = [vs(releases.windows['32bit']), vs(releases.windows['64bit'])];
	const version = vs(
		matchAndValidate(
			urls[0] || '',
			/Arattai[._-]v?(\d+(?:\.\d+)+)(?:[._-]x\d+)?\.exe/i,
		)[1],
	);

	return {
		version,
		urls,
	};
}
