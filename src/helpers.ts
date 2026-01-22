import type { Octokit } from 'octokit';

import fs from '@rcompat/fs';
import { bgRed, blue, green, redBright } from 'ansis';
import { delay } from 'es-toolkit';
import process from 'node:process';
import { z, ZodError } from 'zod';

import { getRepoHeadSha } from '@/github.ts';

export class Logger {
	private logs: string[] = [];

	log(line: string) {
		this.logs.push(line);
	}

	flush() {
		for (const line of this.logs) {
			console.log(line);
		}
		this.logs = [];
	}

	run(task: string) {
		this.log(`${blue('==>')} Running ${task}`);
	}

	present(version: string) {
		this.log(green`Package is up-to-date! (${version})\n`);
	}

	error(task: string, error: Error) {
		this.log(bgRed`❌ Error running ${task}`);
		this.log(redBright`${error instanceof ZodError ? z.prettifyError(error) : error}\n`);
	}

	details(version: string, urls: string[]) {
		this.log(`Version: ${version}`);
		this.log(`URLs: ${urls.join(' ')}\n`);
	}
}

export function compareVersions(a: string, b: string): number {
	const partsA = a.split('.').map(Number);
	const partsB = b.split('.').map(Number);
	const maxLength = Math.max(partsA.length, partsB.length);

	for (let i = 0; i < maxLength; i++) {
		const numA = partsA[i] ?? 0;
		const numB = partsB[i] ?? 0;
		if (numA !== numB) return numA - numB;
	}

	return 0;
}

export function vs(str: unknown) {
	return z.string().parse(str).trim();
}

export function match(str: string | undefined, regex: RegExp) {
	const match = vs(str).match(regex);
	const groups = match?.slice(1);

	if (!groups) {
		throw new Error('Regex match not found');
	}

	const validated = z.array(z.string()).parse(groups);

	if (validated.length === 0) {
		throw new Error('Regex match not found');
	}

	return validated;
}

export async function stateCompare(packageIdentifier: string, newState: string) {
	const versionStatePath = `version_state/${packageIdentifier}`;
	const storedVersion = (await new fs.FileRef(versionStatePath).text()).trim();

	return newState === storedVersion;
}

export async function closeAllButMostRecentPR(octokit: Octokit, packageIdentifier: string) {
	// Wait 5s for GitHub API to update
	await delay(5000);

	const prSearch = await octokit.rest.search.issuesAndPullRequests({
		q: `${packageIdentifier}+is:pr+author:UnownBot+is:open+repo:microsoft/winget-pkgs+sort:created-desc`,
	});

	for (const pr of prSearch.data.items.slice(1)) {
		await octokit.rest.pulls.update({
			owner: 'microsoft',
			repo: 'winget-pkgs',
			pull_number: pr.number,
			state: 'closed',
		});
	}
}

export async function updateVersionState(
	octokit: Octokit,
	packageIdentifier: string,
	latestVersion: string,
) {
	const versionStatePath = `version_state/${packageIdentifier}`;
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
				headline: `Update ${packageIdentifier} version state`,
			},
			fileChanges: {
				additions: [
					{
						path: versionStatePath,
						contents: btoa(latestVersion),
					},
				],
			},
			expectedHeadOid: await getRepoHeadSha(),
		},
	});
}
