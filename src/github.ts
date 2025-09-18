import { Octokit } from 'octokit';
import { extname } from 'node:path';
import process from 'node:process';

export const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });
await octokit.rest.users.getAuthenticated();

export async function getLatestVersion(owner: string, repo: string) {
	const release = await octokit.rest.repos.getLatestRelease({
		owner,
		repo,
	});

	return release.data.tag_name.startsWith('v')
		? release.data.tag_name.substring(1)
		: release.data.tag_name;
}

export async function getLatestUrls(owner: string, repo: string) {
	const release = await octokit.rest.repos.getLatestRelease({
		owner,
		repo,
	});

	const urls: string[] = [];

	for (const asset of release.data.assets) {
		if (
			['.exe', '.msi', '.msix', '.msixbundle', '.appx'].includes(
				extname(asset.name),
			)
		) {
			urls.push(asset.browser_download_url);
		}
	}

	return urls;
}

export async function getLatestPreReleaseVersion(owner: string, repo: string) {
	const release = await octokit.rest.repos.listReleases({
		owner,
		repo,
	});

	const releases = release.data.filter((release) => release.prerelease)[0];
	if (!releases) {
		throw new Error('No pre-release versions found');
	}

	const version = releases.tag_name;

	return version.startsWith('v') ? version.substring(1) : version;
}

export async function getAllReleases(owner: string, repo: string) {
	const releases = await octokit.rest.repos.listReleases({
		owner,
		repo,
	});

	return releases.data.filter((release) => !release.prerelease);
}

export async function getReleaseByTag(
	owner: string,
	repo: string,
	tag: string,
) {
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
		throw new Error(
			'Missing GITHUB_REPOSITORY_OWNER or GITHUB_REPOSITORY environment variable',
		);
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
