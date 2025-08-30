import { getLatestVersion } from '@/github.ts';

export default async function () {
	const tag = await getLatestVersion('xbmc', 'xbmc');

	const version = tag.split('-')[0];
	const urls = [
		`https://mirrors.kodi.tv/releases/windows/win64/kodi-${tag}-x64.exe`,
		`https://mirrors.kodi.tv/releases/windows/win32/kodi-${tag}-x86.exe`,
		`https://mirrors.kodi.tv/releases/windows/winarm64/kodi-${tag}-arm64.exe`,
	];

	return {
		version,
		urls,
	};
}
