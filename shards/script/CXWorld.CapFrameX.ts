import { getLatestRelease } from '@/github.ts';

export default async function () {
	const release = await getLatestRelease({
		owner: 'CXWorld',
		repo: 'CapFrameX',
	});

	return {
		version: () => 'displayVersion',
		urls: () => [
			`https://github.com/CXWorld/CapFrameX/releases/download/${release.rawTag}/release_${release.version}_installer.zip`,
			`https://github.com/CXWorld/CapFrameX/releases/download/${release.rawTag}/release_${release.version}_portable.zip|x64`,
		],
		state: release.rawTag,
	};
}
