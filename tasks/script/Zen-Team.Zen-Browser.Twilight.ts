import { delay } from 'es-toolkit';
import { getReleaseByTag, getRepoHeadSha, octokit } from '@/github.ts';
import { updatePackage } from '@/komac.ts';
import { match, vs } from '@/helpers.ts';
import { readTextFileSync } from '@std/fs/unstable-read-text-file';
import process from 'node:process';

export default async function () {
	const VERSION_REGEX = /Twilight build - (\S+)/;
	const VERSION_STATE_PATH = 'version_state/Zen-Team.Zen-Browser.Twilight';

	const release = await getReleaseByTag('zen-browser', 'desktop', 'twilight');
	const latestVersion = vs(release.name);
	const wingetVersion = readTextFileSync(VERSION_STATE_PATH).trim();

	if (latestVersion === wingetVersion) {
		return 'Current version matches latest version.\n';
	}

	const version = match(latestVersion, VERSION_REGEX)[0];
	const repoVersion = match(wingetVersion, VERSION_REGEX)[0];

	const options = ['--skip-pr-check', ...(version !== repoVersion ? ['-r'] : [])];
	const output = await updatePackage(
		'Zen-Team.Zen-Browser.Twilight',
		version,
		[
			'https://github.com/zen-browser/desktop/releases/download/twilight/zen.installer.exe|x64',
			'https://github.com/zen-browser/desktop/releases/download/twilight/zen.installer-arm64.exe',
		],
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

	// Wait 5s GitHub API to update
	await delay(5000);

	const prSearch = await octokit.rest.search.issuesAndPullRequests({
		q: 'Zen-Team.Zen-Browser.Twilight+is:pr+author:UnownBot+is:open+repo:microsoft/winget-pkgs+sort:created-desc',
	});

	// Close all but the first (most recent) PR
	for (const pr of prSearch.data.items.slice(1)) {
		await octokit.rest.pulls.update({
			owner: 'microsoft',
			repo: 'winget-pkgs',
			pull_number: pr.number,
			state: 'closed',
		});
	}

	return output;
}
