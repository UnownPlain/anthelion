import { delay } from '@es-toolkit/es-toolkit';
import { getReleaseByTag, octokit } from '../src/github.ts';
import { updatePackage } from '../src/komac.ts';
import { matchAndValidate, validateString } from '../src/validate.ts';

const VERSION_REGEX = /(?<=Twilight build - )\S+/;
const VERSION_STATE_PATH = 'version-state/Zen-Team.Zen-Browser.Twilight';
const PACKAGE_ID = 'Zen-Team.Zen-Browser.Twilight';
const DOWNLOAD_URLS = [
	'https://github.com/zen-browser/desktop/releases/download/twilight/zen.installer.exe|x64',
	'https://github.com/zen-browser/desktop/releases/download/twilight/zen.installer-arm64.exe',
];
const PR_SEARCH_QUERY =
	'Zen-Team.Zen-Browser.Twilight+is:pr+author:UnownBot+is:open+repo:microsoft/winget-pkgs+sort:created-desc';
const API_DELAY_MS = 5000;

export default async function () {
	const versionInfo = await getReleaseByTag(
		'zen-browser',
		'desktop',
		'twilight',
	);

	const latestVersion = validateString(versionInfo.name);
	const currentVersion = Deno.readTextFileSync(VERSION_STATE_PATH).trim();

	if (latestVersion === currentVersion) {
		return 'Current version matches latest version.\n';
	}

	const version = matchAndValidate(latestVersion, VERSION_REGEX)[0];
	const repoVersion = matchAndValidate(
		validateString(currentVersion),
		VERSION_REGEX,
	)[0];

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
				repositoryNameWithOwner: Deno.env.get('GITHUB_REPOSITORY'),
				branchName: Deno.env.get('GITHUB_REF_NAME'),
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
			expectedHeadOid: Deno.env.get('GITHUB_SHA'),
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
		await octokit.rest.pulls.update({
			owner: 'microsoft',
			repo: 'winget-pkgs',
			pull_number: pr.number,
			state: 'closed',
		});
	}

	return output;
}
