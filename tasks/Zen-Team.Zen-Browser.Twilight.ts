import { octokit } from '../src/github.ts';
import { getReleaseByTag } from '../src/github.ts';
import { updatePackage } from '../src/komac.ts';
import { validateMatch, validateString } from '../src/validate.ts';

export default async function () {
	const versionInfo = await getReleaseByTag(
		'zen-browser',
		'desktop',
		'twilight'
	);

	const VERSION_STATE_PATH = 'version-state/Zen-Team.Zen-Browser.Twilight';
	const latestVersion = validateString(versionInfo.name);
	const currentVersion = Deno.readTextFileSync(VERSION_STATE_PATH).trim();

	if (latestVersion === currentVersion) {
		console.log('Current version matches latest version.');
		return;
	}

	const version = validateMatch(
		latestVersion.match(/(?<=Twilight build - )\S+/)
	)[0];
	const repoVersion = validateMatch(
		validateString(currentVersion).match(/(?<=Twilight build - )\S+/)
	)[0];
	const urls = [
		`https://github.com/zen-browser/desktop/releases/download/twilight/zen.installer.exe|x64`,
		`https://github.com/zen-browser/desktop/releases/download/twilight/zen.installer-arm64.exe`,
	];

	const packageId = 'Zen-Team.Zen-Browser.Twilight';
	const options = ['--skip-pr-check'];

	if (version != repoVersion) {
		options.push('-r');
	}

	await updatePackage(packageId, version, urls, ...options);

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

	// Wait 5 seconds for API to update
	await new Promise((resolve) => setTimeout(resolve, 5000));

	const prSearch = await octokit.rest.search.issuesAndPullRequests({
		q: 'Zen-Team.Zen-Browser.Twilight+is:pr+author:UnownBot+is:open+repo:microsoft/winget-pkgs+sort:created-desc',
		advanced_search: 'true',
	});

	for (let i = 1; i < prSearch.data.total_count; i++) {
		await octokit.rest.pulls.update({
			owner: 'microsoft',
			repo: 'winget-pkgs',
			pull_number: prSearch.data.items[i].number,
			state: 'closed',
		});
	}
}
