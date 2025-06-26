import { validateString } from '../src/validate.ts';
import ky from 'ky';

export default async function () {
	const versionInfo = await ky(
		'https://electorrent.vercel.app/update/exe/0.0.0',
	).json<{ name: string; url: string }>();

	const version = validateString(versionInfo.name);
	const urls = [validateString(versionInfo.url)];

	return {
		version,
		urls,
	};
}
