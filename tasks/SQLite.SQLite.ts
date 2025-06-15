import { matchAndValidate } from '../src/validate.ts';

export default async function () {
	const response = await fetch('https://www.sqlite.org/download.html');
	const versionInfo = await response.text();
	const regex =
		/\d+-bit DLL \(x\d+\) for SQLite version ([\d.]+)\..*?(\d+)\/sqlite-tools-win-x64-(\d+)/ms;

	const match = matchAndValidate(versionInfo, regex);
	const version = match[1];
	const year = match[2];
	const encodedVersion = match[3];

	const urls = [
		`https://www.sqlite.org/${year}/sqlite-tools-win-x64-${encodedVersion}.zip`,
	];

	return {
		version,
		urls,
	};
}
