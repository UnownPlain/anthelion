import { vs } from '@/helpers.ts';
import ky from 'ky';

export default async function () {
	const releases = await ky(
		'https://x.raycast-releases.com/releases/latest',
	).json<{
		version: string;
		builds: Array<{ url: string }>;
	}>();

	const version = vs(releases.version);
	const urls = releases.builds.map((build) => vs(build.url));

	return {
		version,
		urls,
	};
}
