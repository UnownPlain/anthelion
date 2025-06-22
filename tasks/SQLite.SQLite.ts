import { matchAndValidate } from '../src/validate.ts';
import ky from 'ky';

export default async function () {
	const versionInfo = await ky('https://www.sqlite.org/download.html').text();
	const regex =
		/\d+-bit DLL \(x\d+\) for SQLite version ([\d.]+)\..*?(\d+)\/sqlite-tools-win-x64-(\d+)/ms;

	const match = matchAndValidate(versionInfo, regex);
	const year = match[2];
	const encodedVersion = match[3];

	const version = match[1];
	const urls = [
		`https://www.sqlite.org/${year}/sqlite-tools-win-x64-${encodedVersion}.zip`,
	];

	return {
		version,
		urls,
	};
}
