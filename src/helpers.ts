import fs from '@rcompat/fs';
import {
	getExistingPullRequest,
	type ExistingPullRequestResult,
	type UpdateVersionResult,
} from '@unownplain/anthelion-komac';
import { bgRed, blue, green, magenta, redBright, yellow } from 'ansis';
import { delay } from 'es-toolkit';
import ky from 'ky';
import { z, ZodError } from 'zod';

import { getTargetRepository } from '@/config';
import { githubClient, getRepositoryHeadSha } from '@/github.ts';

export class Logger {
	private logs: string[] = [];

	log(line: string) {
		this.logs.push(line);
	}

	blankLine() {
		if (this.logs.at(-1) !== '') {
			this.logs.push('');
		}
	}

	logUpdateResult(result: UpdateVersionResult) {
		for (const file of result.changes) {
			this.logs.push(file.content);
		}
		this.logs.push(
			`Pull request URL: ${result.pullRequestUrl ? result.pullRequestUrl : 'Dry Run'}`,
		);
	}

	stateMatches() {
		this.logs.push(green`Stored state matches latest state.`);
	}

	flush() {
		for (const line of this.logs) {
			console.log(line);
		}
		this.logs = [];
	}

	run(shard: string) {
		this.log(`${blue('==>')} Running ${shard}`);
	}

	duration(shard: string, milliseconds: number) {
		this.log(`${magenta('==>')} Completed ${shard} in ${formatDuration(milliseconds)}`);
	}

	present(version: string) {
		this.log(green`Package is up-to-date! (${version})`);
	}

	prExists(pr: ExistingPullRequestResult) {
		if (pr.createdByAuthenticatedUser) {
			this.log(green`PR with state ${pr.state} was created at ${pr.createdAt}.`);
		} else {
			this.log(
				yellow`PR created by ${pr.createdBy} with state ${pr.state} created at ${pr.createdAt}.`,
			);
		}
		this.log(pr.pullRequestUrl);
	}

	error(shard: string, error: unknown) {
		this.log(bgRed`❌ Error running ${shard}`);
		this.log(redBright(formatError(error)));
	}

	details(version: string, urls: string[]) {
		this.log(`Version: ${version}`);
		this.log(`URLs: ${urls.join(' ')}\n`);
	}
}

function formatDuration(milliseconds: number) {
	if (milliseconds < 1000) {
		return `${milliseconds.toFixed(0)}ms`;
	}

	const seconds = milliseconds / 1000;
	if (seconds < 60) {
		return `${seconds.toFixed(2)}s`;
	}

	const minutes = Math.floor(seconds / 60);
	const remainingSeconds = seconds % 60;
	return `${minutes}m ${remainingSeconds.toFixed(2)}s`;
}

function formatError(error: unknown) {
	if (error instanceof ZodError) {
		const prettyError = z.prettifyError(error);
		return error.stack ? `${prettyError}\n\n${error.stack}` : prettyError;
	}

	if (error instanceof Error) {
		return error.stack ?? error.message;
	}

	return String(error);
}

export function compareVersions(a: string, b: string) {
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

export function getShardTarget(shardName: string) {
	const font = shardName.endsWith('.Font');

	return {
		packageIdentifier: font ? shardName.slice(0, -'.Font'.length) : shardName,
		font,
	};
}

export function get(obj: unknown, path: string, defaultValue?: unknown): unknown {
	return (
		path.split('.').reduce((acc, key) => (acc as Record<string, unknown>)?.[key], obj) ??
		defaultValue
	);
}

export function isHttpUrl(value: string) {
	return z.url().safeParse(value).success;
}

export function resolveValuePlaceholders(template: string, values: Record<string, unknown>) {
	const VALUE_PLACEHOLDER_REGEX =
		/\{([A-Za-z_]\w*(?:\.[A-Za-z_]\w*)*)(?:\|([^|{}]*)\|([^{}]*))?\}/g;

	return template.replaceAll(VALUE_PLACEHOLDER_REGEX, (placeholder, path, from, to) => {
		const value = get(values, path);
		if (typeof value !== 'string') {
			throw new Error(`Unable to resolve placeholder ${placeholder}`);
		}
		return from ? value.replaceAll(from, to ?? '') : value;
	});
}

export function match(str: string | undefined, regex: RegExp) {
	const globalRegex = regex.global ? regex : new RegExp(regex.source, `${regex.flags}g`);
	const matches = Array.from(vs(str).matchAll(globalRegex));
	const groups = matches.flatMap((match) => match.slice(1));
	const validated = z.array(z.string()).parse(groups);

	if (validated.length === 0) {
		throw new Error('Regex match not found');
	}

	return validated;
}

export async function isStateMatching(packageIdentifier: string, newState: string) {
	if (process.env.DRY_RUN) return;
	const versionStatePath = `version-state/${packageIdentifier}`;
	const storedVersion = (await fs.ref(versionStatePath).text()).trim();

	return newState === storedVersion;
}

export async function checkVersionInRepo(
	version: string,
	packageIdentifier: string,
	logger = new Logger(),
	font = false,
	ignoreOtherPrs = false,
) {
	if (process.env.DRY_RUN) return false;

	const { owner, repo, branch } = getTargetRepository();

	const manifestDirectory = font ? 'fonts' : 'manifests';
	const JSDELIVR_MANIFEST_ROOT = `https://cdn.jsdelivr.net/gh/${owner}/${repo}@${branch}/${manifestDirectory}`;
	const GITHUB_MANIFEST_ROOT = `https://raw.githubusercontent.com/${owner}/${repo}/${branch}/${manifestDirectory}`;
	const MANIFEST_PATH = `${packageIdentifier.charAt(0).toLowerCase()}/${packageIdentifier
		.split('.')
		.join('/')}/${version}/${packageIdentifier}.yaml`;
	const jsdelivrUrl = `${JSDELIVR_MANIFEST_ROOT}/${MANIFEST_PATH}`;
	const githubUrl = `${GITHUB_MANIFEST_ROOT}/${MANIFEST_PATH}`;

	const response = ignoreOtherPrs
		? await ky.get(githubUrl, {
				throwHttpErrors: false,
			})
		: await ky.head(jsdelivrUrl, {
				throwHttpErrors: false,
			});

	if (response.ok && !process.env.DRY_RUN && !ignoreOtherPrs) {
		logger.present(version);
		return true;
	}

	if (response.ok && ignoreOtherPrs && (await response.text()).includes('# Created by Anthelion')) {
		logger.present(version);
		return true;
	}

	const existingPR = await getExistingPullRequest({
		packageIdentifier,
		version,
		ignorePullRequestsCreatedByOtherUsers: ignoreOtherPrs,
	});

	if (ignoreOtherPrs && existingPR && existingPR.state === 'closed') {
		return false;
	}
	if (existingPR) {
		logger.prExists(existingPR);
		return true;
	}

	return false;
}

export async function closeAllButMostRecentPR(packageIdentifier: string) {
	if (process.env.DRY_RUN) return;

	// Wait for GitHub API to update
	await delay(10_000);

	const { owner, repo } = getTargetRepository();
	const { data: authenticatedUser } = await githubClient.rest.users.getAuthenticated();

	const prSearch = await githubClient.rest.search.issuesAndPullRequests({
		q: `${packageIdentifier} is:pr author:${authenticatedUser.login} is:open repo:${owner}/${repo} sort:created-desc`,
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

export async function updateVersionState(packageIdentifier: string, latestVersion: string) {
	if (process.env.DRY_RUN) return;

	const versionStatePath = `version-state/${packageIdentifier}`;
	const mutation = `
		mutation UpdateFile($input: CreateCommitOnBranchInput!) {
			createCommitOnBranch(input: $input) {
				commit {
					url
				}
			}
		}
	`;

	await githubClient.graphql(mutation, {
		input: {
			branch: {
				repositoryNameWithOwner: process.env.GITHUB_REPOSITORY,
				branchName: process.env.GITHUB_REF_NAME,
			},
			message: {
				headline: `[ci skip] Update ${packageIdentifier} version state`,
			},
			fileChanges: {
				additions: [
					{
						path: versionStatePath,
						contents: btoa(latestVersion),
					},
				],
			},
			expectedHeadOid: await getRepositoryHeadSha(),
		},
	});
}

export function normalizeVersion(version: string, remove?: string) {
	const normalized = version.startsWith('v') ? version.substring(1) : version;
	return remove ? normalized.replaceAll(remove, '') : normalized;
}

export function resolveDataBackedUrls(urls: string[], data: unknown) {
	return urls.map((url) => (isHttpUrl(url) ? url : vs(get(data, url))));
}

export function firstMatch(str: string, regex: RegExp, errorMessage?: string) {
	const version = match(str, regex)[0];
	if (!version) {
		throw new Error(errorMessage);
	}

	return version;
}

type TemplateValue = string | number | bigint | boolean | null | undefined;

export function dedent(strings: TemplateStringsArray, ...values: TemplateValue[]) {
	let text = strings[0] ?? '';

	for (let i = 0; i < values.length; i++) {
		text += `${values[i] ?? ''}${strings[i + 1] ?? ''}`;
	}

	const lines = text
		.replace(/^\r?\n/, '')
		.replace(/\r?\n[\t ]*$/, '')
		.split(/\r?\n/);
	const indentation = lines
		.filter((line) => line.trim().length > 0)
		.map((line) => line.match(/^[\t ]*/)?.[0].length ?? 0);
	const minIndentation = Math.min(...indentation);

	if (!Number.isFinite(minIndentation) || minIndentation === 0) {
		return lines.join('\n');
	}

	return lines.map((line) => (line.trim().length > 0 ? line.slice(minIndentation) : '')).join('\n');
}
