import { validateString } from '../src/validate.ts';

export default async function () {
	const response = await fetch(
		'https://googlechromelabs.github.io/chrome-for-testing/last-known-good-versions.json',
	);
	const versionInfo = await response.json();

	const version = validateString(versionInfo.channels.Stable.version);
	const urls = [
		`https://storage.googleapis.com/chrome-for-testing-public/${version}/win64/chromedriver-win64.zip`,
		`https://storage.googleapis.com/chrome-for-testing-public/${version}/win32/chromedriver-win32.zip`,
	];

	return {
		packageId: 'Chromium.ChromeDriver',
		version,
		urls,
	};
}
