import ky from 'ky';

export default async function () {
	const releases = await ky('https://plex.tv/pms/downloads/5.json').json<{
		computer: {
			Windows: {
				version: string;
				releases: Array<{ url: string }>;
			};
		};
	}>();

	const version = releases.computer.Windows.version.split('-')[0];
	const urls = [
		releases.computer.Windows.releases[0]?.url,
		releases.computer.Windows.releases[1]?.url,
	];

	return {
		version,
		urls,
	};
}
