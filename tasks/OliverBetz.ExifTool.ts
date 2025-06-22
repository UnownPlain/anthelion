import { validateString } from '../src/validate.ts';
import ky from 'ky';

export default async function () {
	const versionInfo = await ky(
		'https://oliverbetz.de/cms/files/Artikel/ExifTool-for-Windows/exiftool_latest_version.txt',
	).text();

	const version = validateString(versionInfo);
	const urls = [
		`https://oliverbetz.de/cms/files/Artikel/ExifTool-for-Windows/ExifTool_install_${version}_64.exe|x64`,
		`https://oliverbetz.de/cms/files/Artikel/ExifTool-for-Windows/ExifTool_install_${version}_32.exe|x86`,
	];

	return {
		version,
		urls,
	};
}
