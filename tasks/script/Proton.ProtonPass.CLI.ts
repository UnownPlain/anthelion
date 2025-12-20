import ky from 'ky';

export default async function () {
	const releases = await ky('https://proton.me/download/pass-cli/versions.json').json<{
		passCliVersions: {
			version: string;
			urls: { windows: { x86_64: { url: string } } };
		};
	}>();

	const version = releases.passCliVersions.version;
	const urls = [releases.passCliVersions.urls.windows.x86_64.url];

	return {
		version,
		urls,
	};
}
