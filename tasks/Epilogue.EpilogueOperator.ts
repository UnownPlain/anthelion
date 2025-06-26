import { pageMatch } from '../src/helpers.ts';

export default async function () {
	const version = await pageMatch(
		'https://www.epilogue.co/downloads',
		/href=.*?\/v?(\d+(?:\.\d+)+)\/release\/windows/i,
	);
	const urls = [
		`https://epilogue.nyc3.cdn.digitaloceanspaces.com/releases/software/Playback/version/${version}/release/windows/playback-setup.exe|x64`,
	];

	return {
		version,
		urls,
	};
}
