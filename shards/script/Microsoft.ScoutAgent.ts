import ky from 'ky';

export default async function () {
	const response = await ky('https://www.microsoft.com/download/details.aspx?id=108685').text();

	const installers = Array.from(
		response.matchAll(
			/"name":"MicrosoftScout-Windows-(?<version>\d+(?:\.\d+)+)-(?:arm64|x64)-Setup\.exe","url":"(?<url>https:\/\/download\.microsoft\.com\/download\/[^"]+?\/MicrosoftScout-Windows-\k<version>-(?:arm64|x64)-Setup\.exe)"/gi,
		),
		(match) => match.groups,
	);
	const version = installers[0]?.version;
	const urls = () => installers.map((installer) => installer?.url);

	return {
		version,
		urls,
	};
}
