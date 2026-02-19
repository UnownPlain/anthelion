import { getReleaseByTag } from '@/github.ts';
import { match } from '@/helpers.ts';

export default async function () {
	const release = await getReleaseByTag('zen-browser', 'desktop', 'twilight');
	const state = release.name || '';
	const [version] = match(state, /Twilight build - (\S+)/);

	return {
		version,
		urls: [
			'https://github.com/zen-browser/desktop/releases/download/twilight/zen.installer.exe|x64',
			'https://github.com/zen-browser/desktop/releases/download/twilight/zen.installer-arm64.exe',
		],
		replace: true,
		skipPrCheck: true,
		state,
	};
}
