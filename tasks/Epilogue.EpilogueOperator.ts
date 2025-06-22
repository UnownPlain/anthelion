import { matchAndValidate } from '../src/validate.ts';
import ky from 'ky';

export default async function () {
	const versionInfo = await ky('https://www.epilogue.co/downloads').text();
	const regex = /href=.*?\/v?(\d+(?:\.\d+)+)\/release\/windows/i;

	const version = matchAndValidate(versionInfo, regex)[1];
	const urls = [
		`https://epilogue.nyc3.cdn.digitaloceanspaces.com/releases/software/Playback/version/${version}/release/windows/playback-setup.exe|x64`,
	];

	return {
		version,
		urls,
	};
}
