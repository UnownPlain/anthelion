import { pageMatch } from '../src/helpers.ts';

export default async function () {
	const version = (
		await pageMatch(
			'https://download.cpuid.com/cpuid.ver',
			/cpuz=(\d+(?:\.\d+)+)/i,
		)
	)
		.split('.')
		.slice(0, -1)
		.join('.');
	const urls = [`https://download.cpuid.com/cpu-z/cpu-z_${version}-en.exe`];

	return {
		version,
		urls,
	};
}
