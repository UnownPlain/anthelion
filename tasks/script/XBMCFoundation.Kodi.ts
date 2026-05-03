import { getLatestRelease } from '@/github.ts';

export default async function () {
	const { tag } = await getLatestRelease({
		owner: 'xbmc',
		repo: 'xbmc',
	});

	const version = tag.split('-')[0];
	const urls = () => [
		`https://mirrors.kodi.tv/releases/windows/win64/kodi-${tag}-x64.exe`,
		`https://mirrors.kodi.tv/releases/windows/win32/kodi-${tag}-x86.exe`,
	];

	return {
		version: `${version}.0.0`,
		urls,
		releaseNotes: {
			source: 'html',
			sourceUrl: `https://kodi.tv/article/kodi-${tag?.replaceAll('.', '-').toLowerCase()}-release/`,
		},
	};
}
