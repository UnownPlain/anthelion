import { pageMatch } from '../src/helpers.ts';

export default async function () {
	const version = await pageMatch(
		'https://sourceforge.net/projects/sbcl/rss?path=/sbcl',
		/url=.*?\/sbcl[._-]v?(\d+(?:\.\d+)+)[._-]/i,
	);
	const urls = [
		`https://sourceforge.net/projects/sbcl/files/sbcl/${version}/sbcl-${version}-x86-64-windows-binary.msi/download`,
	];

	return {
		version,
		urls,
	};
}
