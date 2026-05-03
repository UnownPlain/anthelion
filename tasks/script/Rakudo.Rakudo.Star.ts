import ky from 'ky';

export default async function () {
	const releases = await ky('https://rakudo.org/dl/star/').json<
		Array<{
			latest: number;
			platform: string;
			format: string;
			ver: string;
			url: string;
		}>
	>();

	const latestWindowsMsi = releases.find(
		(release) => release.latest === 1 && release.platform === 'win' && release.format === 'msi',
	)!;

	// https://github.com/rakudo/star/blob/master/tools/build/binary-release/Windows/build-with-choco.ps1
	const version = latestWindowsMsi.ver
		.split('.')
		.map((part) => {
			if (Number.parseInt(part, 10) > 255) {
				part = part.substring(1);
			}
			return String(Number.parseInt(part, 10));
		})
		.join('.');

	return {
		version,
		urls: () => [latestWindowsMsi.url],
	};
}
