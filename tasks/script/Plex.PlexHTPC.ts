import { vs } from '@/helpers.ts';
import ky from 'ky';

export default async function () {
	const releases = await ky('https://plex.tv/api/downloads/7.json').json<{
		computer: {
			Windows: {
				version: string;
				releases: Array<{ url: string }>;
			};
		};
	}>();

	const version = vs(releases.computer.Windows.version.split('-')[0]);
	const urls = [vs(releases.computer.Windows.releases[0]?.url)];

	return {
		version,
		urls,
	};
}
