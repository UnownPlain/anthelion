import { vs } from '@/helpers.ts';
import ky from 'ky';

export default async function () {
	const releases = await ky(
		'https://electorrent.vercel.app/update/exe/0.0.0',
	).json<{ name: string; url: string }>();

	const version = vs(releases.name.substring(1));
	const urls = [vs(releases.url)];

	return {
		version,
		urls,
	};
}
