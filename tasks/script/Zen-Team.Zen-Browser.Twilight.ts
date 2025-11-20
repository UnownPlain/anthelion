import { delay } from 'es-toolkit';
import { getReleaseByTag, getRepoHeadSha, octokit } from '@/github.ts';
import { updatePackage } from '@/komac.ts';
import { match, vs } from '@/helpers.ts';
import { readTextFileSync } from '@std/fs/unstable-read-text-file';
import process from 'node:process';

const VERSION_REGEX = /(?<=Twilight build - )\S+/;
const VERSION_STATE_PATH = 'version_state/Zen-Team.Zen-Browser.Twilight';
const PACKAGE_ID = 'Zen-Team.Zen-Browser.Twilight';
const DOWNLOAD_URLS = [
	'https://github.com/zen-browser/desktop/releases/download/twilight/zen.installer.exe|x64',
	'https://github.com/zen-browser/desktop/releases/download/twilight/zen.installer-arm64.exe',
];
const PR_SEARCH_QUERY =
	'Zen-Team.Zen-Browser.Twilight+is:pr+author:UnownBot+is:open+repo:microsoft/winget-pkgs+sort:created-desc';
const API_DELAY_MS = 5000;

export default async function () {
	const release = await getReleaseByTag('zen-browser', 'desktop', 'twilight');

	const latestVersion = vs(release.name);
	const currentVersion = readTextFileSync(VERSION_STATE_PATH).trim();

	if (latestVersion === currentVersion) {
		return 'Current version matches latest version.\n';
	}

	const version = vs(match(latestVersion, VERSION_REGEX)[0]);
	const repoVersion = match(vs(currentVersion), VERSION_REGEX)[0];

	const options = ['--skip-pr-check'];

	if (version !== repoVersion) {
		options.push('-r');
	}

	const output = await updatePackage(
		PACKAGE_ID,
		version,
		DOWNLOAD_URLS,
		...options,
	);

	const mutation = `
		mutation UpdateFile($input: CreateCommitOnBranchInput!) {
			createCommitOnBranch(input: $input) {
				commit {
					url
				}
			}
		}
	`;

	await octokit.graphql(mutation, {
		input: {
			branch: {
				repositoryNameWithOwner: process.env.GITHUB_REPOSITORY,
				branchName: process.env.GITHUB_REF_NAME,
			},
			message: {
				headline: 'Update Zen Browser Twilight Version',
			},
			fileChanges: {
				additions: [
					{
						path: VERSION_STATE_PATH,
						contents: btoa(latestVersion),
					},
				],
			},
			expectedHeadOid: await getRepoHeadSha(),
		},
	});

	// Wait GitHub API to update
	await delay(API_DELAY_MS);

	const prSearch = await octokit.rest.search.issuesAndPullRequests({
		q: PR_SEARCH_QUERY,
		advanced_search: 'true',
	});

	// Close all but the first (most recent) PR
	for (let i = 1; i < prSearch.data.total_count; i++) {
		const pr = prSearch.data.items[i];
		if (!pr || pr.number == null) continue;
		await octokit.rest.pulls.update({
			owner: 'microsoft',
			repo: 'winget-pkgs',
			pull_number: pr.number,
			state: 'closed',
		});
	}

	return output;
}
