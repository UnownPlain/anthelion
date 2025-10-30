import { matchAndValidate } from '@/helpers.ts';
import ky from 'ky';

export default async function () {
	const response = await ky('https://www.sqlite.org/download.html').text();
	const regex =
		/DLL for Windows x64, SQLite version ([\d.]+)\..*?(\d+)\/sqlite-tools-win-x64-(\d+)/ms;

	const [, version, year, encodedVersion] = matchAndValidate(response, regex);
	const urls = [
		`https://www.sqlite.org/${year}/sqlite-tools-win-x64-${encodedVersion}.zip`,
		`https://www.sqlite.org/${year}/sqlite-tools-win-arm64-${encodedVersion}.zip`,
	];

	return {
		version,
		urls,
	};
}
