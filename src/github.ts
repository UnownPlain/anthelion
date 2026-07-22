import { extname } from 'node:path';

import { delay } from 'es-toolkit';
import ky from 'ky';
import { Octokit } from 'octokit';

import { getTargetRepository } from '@/config';

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

export async function getLatestReleaseFromRedirect({
	owner,
	repo,
	tagIncludes = '',
}: GitHubRepository & { tagIncludes?: string }) {
	const response = await ky.head(`https://github.com/${owner}/${repo}/releases/latest`, {
		redirect: 'manual',
		throwHttpErrors: false,
	});
	const location = response.headers.get('location');

	if (!location) {
		throw new Error('No GitHub release redirect found');
	}

	const releaseUrl = new URL(location, 'https://github.com');
	const pathParts = releaseUrl.pathname.split('/').filter(Boolean);
	const releasesIndex = pathParts.indexOf('releases');
	const tag = pathParts.slice(releasesIndex + 2).join('/');

	if (pathParts.at(-1) === 'latest') {
		throw new Error(`GitHub repository has moved: ${releaseUrl.href}`);
	}
	if (releasesIndex === -1 || pathParts[releasesIndex + 1] !== 'tag' || !tag) {
		throw new Error(`Unexpected GitHub release redirect: ${releaseUrl.href}`);
	}

	return {
		version: tag.replace(/^v/, '').replace(tagIncludes, ''),
		tag: tag.replace(/^v/, ''),
		rawTag: tag,
		title: undefined,
		assetNames: () => [],
		urls: () => [],
	};
}

export async function getLatestRelease(options: LatestReleaseOptions) {
	const {
		owner,
		repo,
		kind = 'stable',
		tagIncludes = '',
		useLatestEndpoint,
		perPage = 25,
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
		rawTag: release.tag_name,
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

export async function closeAllButMostRecentPR(packageIdentifier: string) {
	if (process.env.DRY_RUN) return;

	// Wait for GitHub API to update
	await delay(10_000);

	const { owner, repo } = getTargetRepository();
	const { viewer } = await githubClient.graphql<{ viewer: { login: string } }>(`
		query {
			viewer {
				login
			}
		}
	`);

	const prSearch = await githubClient.rest.search.issuesAndPullRequests({
		q: `${packageIdentifier} in:title is:pr author:${viewer.login} is:open repo:${owner}/${repo} sort:created-desc`,
	});

	for (const pr of prSearch.data.items.slice(1)) {
		await githubClient.rest.pulls.update({
			owner,
			repo,
			pull_number: pr.number,
			state: 'closed',
		});
	}
}
