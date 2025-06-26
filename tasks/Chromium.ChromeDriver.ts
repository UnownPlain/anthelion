import { validateString } from '../src/validate.ts';
import ky from 'ky';

export default async function () {
	const versionInfo = await ky(
		'https://googlechromelabs.github.io/chrome-for-testing/last-known-good-versions.json',
	).json<{ channels: { Stable: { version: string } } }>();

	const version = validateString(versionInfo.channels.Stable.version);
	const urls = [
		`https://storage.googleapis.com/chrome-for-testing-public/${version}/win64/chromedriver-win64.zip`,
		`https://storage.googleapis.com/chrome-for-testing-public/${version}/win32/chromedriver-win32.zip`,
	];

	return {
		version,
		urls,
	};
}
