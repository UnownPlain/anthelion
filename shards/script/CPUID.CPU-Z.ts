import { ReleaseNotesSource } from '@/schema/release-notes.ts';
import { defineShard } from '@/schema/script-shard.ts';
import { pageMatch } from '@/strategies.ts';

export default defineShard(async () => {
	const releases = (
		await pageMatch({
			url: 'https://download.cpuid.com/cpuid.ver',
			regex: /cpuz=(\d+(?:\.\d+){3})/i,
		})
	).version.split('.');

	const version = `${releases[0]}.${releases[1]}${releases[2]}`;
	const urls = () => [
		`https://download.cpuid.com/cpu-z/cpu-z_${version}-en.exe`,
		`https://download.cpuid.com/cpu-z/cpu-z_${version}-cn.exe`,
	];

	return {
		version,
		urls,
		releaseNotes: {
			source: ReleaseNotesSource.Html,
			sourceUrl: `https://www.cpuid.com/softwares/cpu-z.html#version-history`,
		},
	};
});
