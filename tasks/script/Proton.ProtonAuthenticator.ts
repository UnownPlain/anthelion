import ky from 'ky';

export default async function () {
	const releases = await ky('https://proton.me/download/authenticator/windows/version.json').json<{
		Releases: Array<{ CategoryName: string; Version: string }>;
	}>();
	const versions = releases.Releases.filter((version) => version.CategoryName === 'Stable');

	const version = versions[0]?.Version;
	const urls = [
		`https://proton.me/download/authenticator/windows/ProtonAuthenticator_${version}_x64_en-US.msi`,
	];

	return {
		version,
		urls,
	};
}
