import { matchAndValidate } from '@/helpers.ts';
import ky from 'ky';

export default async function () {
	const response = await ky(
		'https://github.com/uazo/cromite/releases/latest/download/updateurl.txt',
	).text();

	const version = matchAndValidate(response, /version=(\d+(?:\.\d+)+)/i)[1];
	const commit = matchAndValidate(response, /commit=([a-f0-9]{40})/i)[1];

	const urls = [
		`https://github.com/uazo/cromite/releases/download/v${version}-${commit}/chrome-win.zip|x64`,
	];

	return {
		version,
		urls,
	};
}
