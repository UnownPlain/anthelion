import { validateString } from '../src/validate.ts';

export default async function () {
	const response = await fetch(
		'https://oliverbetz.de/cms/files/Artikel/ExifTool-for-Windows/exiftool_latest_version.txt',
	);
	const versionInfo = await response.text();

	const version = validateString(versionInfo);
	const urls = [
		`https://oliverbetz.de/cms/files/Artikel/ExifTool-for-Windows/ExifTool_install_${version}_64.exe`,
		`https://oliverbetz.de/cms/files/Artikel/ExifTool-for-Windows/ExifTool_install_${version}_32.exe`,
	];

	return {
		version,
		urls,
	};
}
