import { validateString } from '../src/validate.ts';

export default async function () {
	const response = await fetch('https://plex.tv/api/downloads/6.json');
	const versionInfo = await response.json();

	const version = validateString(versionInfo.computer.Windows.version).split(
		'-',
	)[0];
	const urls = [versionInfo.computer.Windows.releases[0].url];

	return {
		version,
		urls,
	};
}
