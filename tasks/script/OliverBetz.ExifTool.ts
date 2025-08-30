import { vs } from '@/helpers.ts';
import ky from 'ky';

export default async function () {
	const response = await ky(
		'https://oliverbetz.de/cms/files/Artikel/ExifTool-for-Windows/exiftool_latest_version.txt',
	).text();

	const version = vs(response);
	const urls = [
		`https://oliverbetz.de/cms/files/Artikel/ExifTool-for-Windows/ExifTool_install_${version}_64.exe|x64`,
		`https://oliverbetz.de/cms/files/Artikel/ExifTool-for-Windows/ExifTool_install_${version}_32.exe|x86`,
	];

	return {
		version,
		urls,
	};
}
