import { validateString } from '../src/validate.ts';
import ky from 'ky';

export default async function () {
	const versionInfo = await ky('https://plex.tv/api/downloads/7.json').json<{
		computer: {
			Windows: {
				version: string;
				releases: Array<{ url: string }>;
			};
		};
	}>();

	const version = validateString(versionInfo.computer.Windows.version).split(
		'-',
	)[0];
	const urls = [versionInfo.computer.Windows.releases[0].url];

	return {
		version,
		urls,
	};
}
