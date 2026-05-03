import { extname } from 'node:path';

import { Octokit } from 'octokit';

export const githubClient = new Octokit({ auth: process.env.GITHUB_TOKEN });

const INSTALLER_EXTENSIONS = new Set(['.exe', '.msi', '.msix', '.msixbundle', '.appx', '.zip']);

type GitHubRepository = {
	owner: string;
	repo: string;
};

type LatestReleaseOptions = GitHubRepository & {
	kind?: 'stable' | 'prerelease' | 'all';
	tagIncludes?: string;
	useLatestEndpoint?: boolean;
	perPage?: number;
};

export async function getLatestRelease(options: LatestReleaseOptions) {
	const {
		owner,
		repo,
		kind = 'stable',
		tagIncludes = '',
		useLatestEndpoint,
		perPage = 20,
	} = options;
	let release;

	if (useLatestEndpoint) {
		const { data } = await githubClient.rest.repos.getLatestRelease({ owner, repo });
		release = data;
	} else {
		let { data: releases } = await githubClient.rest.repos.listReleases({
			owner,
			repo,
			per_page: perPage,
		});

		switch (kind) {
			case 'all':
				break;
			case 'prerelease':
				releases = releases.filter((release) => release.prerelease);
				break;
			case 'stable':
				releases = releases.filter((release) => !release.prerelease);
				break;
		}

		if (tagIncludes) {
			release = releases.find((release) => release.tag_name.includes(tagIncludes));
		} else {
			release = releases[0];
		}
	}

	if (!release) {
		throw new Error('No GitHub release found');
	}

	return {
		version: release.tag_name.replace(/^v/, '').replace(tagIncludes, ''),
		tag: release.tag_name.replace(/^v/, ''),
		releaseTag: release.tag_name,
		title: release.name,
		assetNames: () => release.assets.map((asset) => asset.name),
		urls: () =>
			release.assets
				.filter((asset) => INSTALLER_EXTENSIONS.has(extname(asset.name)))
				.map((asset) => asset.browser_download_url),
	};
}

export async function getReleaseByTag(options: GitHubRepository & { tag: string }) {
	const { owner, repo, tag } = options;
	const { data } = await githubClient.rest.repos.getReleaseByTag({
		owner,
		repo,
		tag,
	});

	return data;
}

export async function getRepositoryHeadSha() {
	const repository = process.env.GITHUB_REPOSITORY;

	if (!repository) {
		throw new Error('Missing GITHUB_REPOSITORY environment variable');
	}

	const [owner, repo] = repository.split('/');
	if (!owner || !repo) {
		throw new Error('Invalid GITHUB_REPOSITORY format; expected owner/repo');
	}

	const { data } = await githubClient.rest.repos.getCommit({
		owner,
		repo,
		ref: 'HEAD',
	});

	return data.sha;
}
