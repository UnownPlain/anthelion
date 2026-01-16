import { extname } from 'node:path';
import process from 'node:process';
import { Octokit } from 'octokit';

export const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });

export async function getLatestVersion(options: {
	owner: string;
	repo: string;
	preRelease?: boolean;
	tagFilter?: string;
	latest?: boolean;
}) {
	const { owner, repo, preRelease = false, tagFilter = '', latest = false } = options;

	let release;

	if (latest) {
		const { data } = await octokit.rest.repos.getLatestRelease({
			owner,
			repo,
		});
		release = data;
	} else {
		const { data } = await octokit.rest.repos.listReleases({
			owner,
			repo,
		});

		const releases = data.filter(
			(r) => r.prerelease === preRelease && r.tag_name.includes(tagFilter),
		);
		if (!releases[0]) {
			throw new Error('No releases found');
		}
		release = releases[0];
	}

	const urls = release.assets
		.filter((asset) =>
			['.exe', '.msi', '.msix', '.msixbundle', '.appx'].includes(extname(asset.name)),
		)
		.map((asset) => asset.browser_download_url);

	return {
		version: release.tag_name.replace(/^v/, '').replace(tagFilter ?? '', ''),
		urls,
	};
}

export async function getAllReleases(owner: string, repo: string, preRelease?: boolean) {
	const { data: releases } = await octokit.rest.repos.listReleases({
		owner,
		repo,
		per_page: 20,
	});

	if (preRelease === undefined) {
		return releases;
	}

	return releases.filter((release) => release.prerelease === preRelease);
}

export async function getReleaseByTag(owner: string, repo: string, tag: string) {
	const release = await octokit.rest.repos.getReleaseByTag({
		owner,
		repo,
		tag,
	});

	return release.data;
}

export async function getRepoHeadSha() {
	const REPO_OWNER = process.env.GITHUB_REPOSITORY_OWNER;
	const REPO = process.env.GITHUB_REPOSITORY;

	if (!REPO_OWNER || !REPO) {
		throw new Error('Missing GITHUB_REPOSITORY_OWNER or GITHUB_REPOSITORY environment variable');
	}

	const parts = REPO.split('/');
	if (!parts[1]) {
		throw new Error('Invalid GITHUB_REPOSITORY format; expected owner/repo');
	}

	const commit = await octokit.rest.repos.getCommit({
		owner: REPO_OWNER,
		repo: parts[1],
		ref: 'HEAD',
	});

	return commit.data.sha;
}
