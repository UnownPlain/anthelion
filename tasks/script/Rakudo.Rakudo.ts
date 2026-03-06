import ky from 'ky';

export default async function () {
	const releases = await ky('https://rakudo.org/dl/rakudo/').json<
		Array<{
			latest: number;
			platform: string;
			format: string;
			ver: string;
			build_rev: number;
			url: string;
		}>
	>();
	const latestWindowsMsi = releases.find(
		(release) => release.latest === 1 && release.platform === 'win' && release.format === 'msi',
	)!;

	// https://github.com/rakudo/rakudo/blob/main/tools/build/binary-release/build-windows.ps1
	const [year, ...versionParts] = latestWindowsMsi.ver.split('.');
	const shortYear = year?.slice(2);
	const normalizedParts = versionParts.map((part) => String(Number.parseInt(part, 10)));
	const version = [shortYear, ...normalizedParts, String(latestWindowsMsi.build_rev)].join('.');

	return {
		version,
		urls: [latestWindowsMsi.url],
	};
}
