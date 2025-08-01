import { pageMatch } from '../src/helpers.ts';

export default async function () {
	const version = await pageMatch(
		'https://sumo.dlr.de/docs/Downloads.php#windows',
		/href=["']?[^"']*?sumo-win64[._-](\d+(?:\.\d+)+)\.msi/i,
	);
	const urls = [
		`https://sumo.dlr.de/releases/${version}/sumo-win64-${version}.msi`,
	];

	return {
		version,
		urls,
	};
}
