import { match } from '@/helpers';
import ky from 'ky';

export default async function () {
	const response = await ky('https://sourceforge.net/projects/astyle/rss?path=/astyle').text();
	const [version] = match(response, /astyle[._-]v?(\d+(?:\.\d+)+)[._-]/);
	const pathVersion = version.split('.').slice(0, -1).join('.');

	const urls = [
		`https://sourceforge.net/projects/astyle/files/astyle/astyle%20${pathVersion}/astyle-${version}.zip/download`,
		`https://sourceforge.net/projects/astyle/files/astyle/astyle%20${pathVersion}/astyle-${version}-x64.zip/download`,
	];

	return {
		version,
		urls,
	};
}
