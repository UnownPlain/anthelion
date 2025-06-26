import { matchAndValidate } from '../src/validate.ts';
import ky from 'ky';

export default async function () {
	const versionInfo = await ky(
		'https://sourceforge.net/projects/swig/rss?path=/swig',
	).text();
	const regex = /url=.*?\/swig[._-]v?(\d+(?:\.\d+)+)\.t/i;

	const version = matchAndValidate(versionInfo, regex)[1];
	const urls = [
		`https://sourceforge.net/projects/swig/files/swigwin/swigwin-${version}/swigwin-${version}.zip/download`,
	];

	return {
		version,
		urls,
	};
}
