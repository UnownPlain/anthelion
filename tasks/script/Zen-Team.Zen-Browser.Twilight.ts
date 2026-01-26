import { getReleaseByTag } from '@/github.ts';
import { match } from '@/helpers.ts';
import { versionStateStrategy } from '@/strategies';

export default async function () {
	const release = await getReleaseByTag('zen-browser', 'desktop', 'twilight');
	const newState = release.name || '';
	const [version] = match(newState, /Twilight build - (\S+)/);

	return await versionStateStrategy({
		packageIdentifier: 'Zen-Team.Zen-Browser.Twilight',
		newState,
		version,
		urls: [
			'https://github.com/zen-browser/desktop/releases/download/twilight/zen.installer.exe|x64',
			'https://github.com/zen-browser/desktop/releases/download/twilight/zen.installer-arm64.exe',
		],
		options: ['-r', '--skip-pr-check'],
	});
}
