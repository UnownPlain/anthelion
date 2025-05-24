import { getLatestRelease } from '../src/github.ts';

export default async function () {
	const version = await getLatestRelease('ccache', 'ccache');
	const urls = [
		`https://github.com/ccache/ccache/releases/download/v${version}/ccache-${version}-windows-i686.zip`,
		`https://github.com/ccache/ccache/releases/download/v${version}/ccache-${version}-windows-x86_64.zip`,
	];

	return {
		version,
		urls,
	};
}
