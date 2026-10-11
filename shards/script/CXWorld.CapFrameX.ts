import { getTargetRepository } from '@/config';
import { getLatestRelease, githubClient } from '@/github.ts';
import { compareVersions } from '@/helpers';
import { defineShard } from '@/schema/script-shard.ts';

export default defineShard(async () => {
	const release = await getLatestRelease({
		owner: 'CXWorld',
		repo: 'CapFrameX',
		useLatestEndpoint: true,
	});
	const assets = ['installer', 'portable'].map((kind) => {
		const name = `release_${release.version}_${kind}.zip`;
		const asset = release.assets.find((asset) => asset.name === name);
		if (!asset || asset.state !== 'uploaded') {
			throw new Error(`No uploaded ${name} asset found`);
		}
		return asset;
	});
	const urls = () => {
		return assets.map((asset) => ({
			url: asset.browser_download_url,
			architecture: 'x64' as const,
		}));
	};

	const { owner, repo, branch } = getTargetRepository();
	const { data: versions } = await githubClient.rest.repos.getContent({
		owner,
		repo,
		ref: branch,
		path: 'manifests/c/CXWorld/CapFrameX',
	});
	if (!Array.isArray(versions)) {
		throw new Error('CapFrameX manifest directory was not found');
	}
	const latestVersion = versions
		.filter((entry) => entry.type === 'dir' && /^\d+(?:\.\d+)*$/.test(entry.name))
		.map((entry) => entry.name)
		.sort(compareVersions)
		.at(-1);

	return {
		version: { source: 'display' },
		urls,
		state: JSON.stringify([
			release.rawTag,
			...assets.map((asset) => asset.digest || `${asset.id}:${asset.updated_at}`),
		]),
		replace: latestVersion?.startsWith(`${release.version}.`) ?? false,
	};
});
