import { validateString } from '../src/validate.ts';
import ky from 'ky';

export default async function () {
	const versionInfo = await ky(
		'https://x.raycast-releases.com/releases/latest',
	).json<{
		version: string;
		builds: Array<{ url: string }>;
	}>();

	const version = validateString(versionInfo.version);
	const urls = versionInfo.builds.map((build) => build.url);

	return {
		version,
		urls,
	};
}
