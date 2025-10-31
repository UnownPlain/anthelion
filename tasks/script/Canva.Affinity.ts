import { vs } from '@/helpers';
import ky from 'ky';

export default async function () {
	const release = await ky(
		'https://things.seriflabs.com/affinity-update-windows-retail-studiopro-x64-packaged',
	).json<{
		version: string;
		uri: string;
	}>();

	const version = vs(release.version);
	const urls = [vs(release.uri), vs(release.uri.replace('x64', 'arm64'))];

	return {
		version,
		urls,
	};
}
