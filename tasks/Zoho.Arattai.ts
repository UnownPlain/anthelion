import { matchAndValidate, validateString } from '../src/validate.ts';
import ky from 'ky';

export default async function () {
	const versionInfo = await ky(
		'https://downloads.zohocdn.com/arattai-desktop/artifacts.json',
	).json<{ windows: { '32bit': string; '64bit': string } }>();

	const urls = [
		validateString(versionInfo.windows['32bit']),
		validateString(versionInfo.windows['64bit']),
	];
	const version = matchAndValidate(
		urls[0],
		/Arattai[._-]v?(\d+(?:\.\d+)+)(?:[._-]x\d+)?\.exe/i,
	)[1];

	return {
		version,
		urls,
	};
}
