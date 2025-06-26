import { pageMatch } from '../src/helpers.ts';

export default async function () {
	const version = await pageMatch(
		'https://sourceforge.net/projects/swig/rss?path=/swig',
		/url=.*?\/swig[._-]v?(\d+(?:\.\d+)+)\.t/i,
	);
	const urls = [
		`https://sourceforge.net/projects/swig/files/swigwin/swigwin-${version}/swigwin-${version}.zip/download`,
	];

	return {
		version,
		urls,
	};
}
