import { matchAndValidate } from '../src/validate.ts';
import ky from 'ky';

export default async function () {
	const versionInfo = await ky('https://geoserver.org/release/stable/').text();
	const regex = /\/GeoServer\/v?(\d+(?:\.\d+)+)\/?/i;

	const version = matchAndValidate(versionInfo, regex)[1];
	const urls = [
		`https://sourceforge.net/projects/geoserver/files/GeoServer/${version}/GeoServer-${version}-winsetup.exe/download`,
	];

	return {
		version,
		urls,
	};
}
