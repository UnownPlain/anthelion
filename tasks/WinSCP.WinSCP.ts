import { pageMatch } from '../src/helpers.ts';

export default async function () {
	const version = await pageMatch(
		'https://winscp.net/eng/downloads.php',
		/href=.*?WinSCP[._-](\d+(?:\.\d+)+)[._-]Setup\.exe/i,
	);
	const urls = [
		`https://sourceforge.net/projects/winscp/files/WinSCP/${version}/WinSCP-${version}-Setup.exe/download`,
		`https://sourceforge.net/projects/winscp/files/WinSCP/${version}/WinSCP-${version}.msi/download`,
	];

	return {
		version,
		urls,
	};
}
