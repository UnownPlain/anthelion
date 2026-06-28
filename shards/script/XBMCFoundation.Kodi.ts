import { getLatestReleaseFromRedirect } from '@/github.ts';
import { ReleaseNotesSource } from '@/schema/release-notes.ts';
import { defineShard } from '@/schema/script-shard.ts';

export default defineShard(async () => {
	const { tag } = await getLatestReleaseFromRedirect({
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
			source: ReleaseNotesSource.Html,
			sourceUrl: `https://kodi.tv/article/kodi-${tag?.replaceAll('.', '-').toLowerCase()}-release/`,
		},
	};
});
