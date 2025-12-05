import { getLatestVersion } from '@/github.ts';

export default async function () {
	const { version: tag } = await getLatestVersion({
		owner: 'xbmc',
		repo: 'xbmc',
	});

	const version = tag.split('-')[0];
	const urls = [
		`https://mirrors.kodi.tv/releases/windows/win64/kodi-${tag}-x64.exe`,
		`https://mirrors.kodi.tv/releases/windows/win32/kodi-${tag}-x86.exe`,
	];

	return {
		version: `${version}.0.0`,
		urls,
	};
}
