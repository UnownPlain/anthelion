import { pageMatch } from '@/strategies.ts';

export default async function () {
	const releases = (
		await pageMatch(
			'https://download.cpuid.com/cpuid.ver',
			/cpuz=(\d+(?:\.\d+){3})/i,
		)
	).split('.');

	const version = `${releases[0]}.${releases[1]}${releases[2]}`;
	const urls = [`https://download.cpuid.com/cpu-z/cpu-z_${version}-en.exe`];

	return {
		version,
		urls,
	};
}
