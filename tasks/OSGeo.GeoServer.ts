import { pageMatch } from '../src/helpers.ts';

export default async function () {
	const version = await pageMatch(
		'https://geoserver.org/release/stable/',
		/\/GeoServer\/v?(\d+(?:\.\d+)+)\/?/i,
	);
	const urls = [
		`https://sourceforge.net/projects/geoserver/files/GeoServer/${version}/GeoServer-${version}-winsetup.exe/download`,
	];

	return {
		version,
		urls,
	};
}
