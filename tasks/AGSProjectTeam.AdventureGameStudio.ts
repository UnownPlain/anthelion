import { getLatestRelease, getLatestUrls } from '../src/github.ts';
import { updatePackage } from '../src/komac.ts';

export default async function () {
	const version = await getLatestRelease('adventuregamestudio', 'ags');
	const urls = await getLatestUrls('adventuregamestudio', 'ags');

	await updatePackage('AGSProjectTeam.AdventureGameStudio', version, urls);
}
