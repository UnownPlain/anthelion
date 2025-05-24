import { getLatestRelease, getLatestUrls } from '../src/github.ts';

export default async function () {
	const version = await getLatestRelease('adventuregamestudio', 'ags');
	const urls = await getLatestUrls('adventuregamestudio', 'ags');

	return {
		packageId: 'AGSProjectTeam.AdventureGameStudio',
		version,
		urls,
	};
}
