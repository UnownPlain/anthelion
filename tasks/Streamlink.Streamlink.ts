import { getLatestRelease, getLatestUrls } from '../src/github.ts';
import { updatePackage } from '../src/komac.ts';

export default async function () {
	const version = await getLatestRelease('streamlink', 'windows-builds');
	const urls = await getLatestUrls('streamlink', 'windows-builds');

	await updatePackage('Streamlink.Streamlink', version, urls);
}
