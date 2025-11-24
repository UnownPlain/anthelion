import { match } from '@/helpers.ts';
import ky from 'ky';

export default async function () {
	const response = await ky(
		'https://github.com/uazo/cromite/releases/latest/download/updateurl.txt',
	).text();

	const [version, commit] = match(response, /version=([\d.]+).*?commit=([a-f0-9]+)/);

	const urls = [
		`https://github.com/uazo/cromite/releases/download/v${version}-${commit}/chrome-win.zip|x64`,
	];

	return {
		version,
		urls,
	};
}
