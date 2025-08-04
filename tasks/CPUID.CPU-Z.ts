import { pageMatch } from '../src/helpers.ts';

export default async function () {
	const versionInfo = (
		await pageMatch(
			'https://download.cpuid.com/cpuid.ver',
			/cpuz=(\d+(?:\.\d+)+)/i,
		)
	).split('.');

	const version = `${versionInfo[0]}.${versionInfo[1]}${versionInfo[2]}`;
	const urls = [`https://download.cpuid.com/cpu-z/cpu-z_${version}-en.exe`];

	return {
		version,
		urls,
	};
}
