import fs from '@rcompat/fs';
import {
	Komac,
	type PullRequest,
	type UpdatePackageRequest,
	type UpdatePackageResult,
} from '@unownplain/anthelion-komac';
import { bgRed, blue, green, magenta, redBright, yellow } from 'ansis';
import ky from 'ky';
import { z, ZodError } from 'zod';

import { getTargetRepository } from '@/config';
import { githubClient, getRepositoryHeadSha } from '@/github.ts';

export const komac = new Komac();

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

	logUpdateResult(result: UpdatePackageResult) {
		for (const file of result.manifests) {
			this.logs.push(file.yaml);
		}
		this.logs.push(`Pull request URL: ${result.pullRequest?.url ?? 'Dry Run'}`);
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

	prExists(pr: PullRequest) {
		if (pr.authoredByCurrentUser) {
			this.log(green`PR with state ${pr.state} was created at ${pr.createdAt}.`);
		} else {
			this.log(
				yellow`PR created by ${pr.author} with state ${pr.state} created at ${pr.createdAt}.`,
			);
		}
		this.log(pr.url);
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

export function parseString(value: unknown) {
	return z.string().parse(value).trim();
}

export function getShardTarget(shardName: string) {
	const font = shardName.endsWith('.Font');

	return {
		packageIdentifier: font ? shardName.slice(0, -'.Font'.length) : shardName,
		font,
	};
}

export function getPath(value: unknown, path: string, defaultValue?: unknown): unknown {
	return (
		path.split('.').reduce((acc, key) => (acc as Record<string, unknown>)?.[key], value) ??
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
		const value = getPath(values, path);
		if (typeof value !== 'string') {
			throw new Error(`Unable to resolve placeholder ${placeholder}`);
		}
		return from ? value.replaceAll(from, to ?? '') : value;
	});
}

export function match(value: unknown, regex: RegExp, errorMessage = 'Regex match not found') {
	const globalRegex = regex.global ? regex : new RegExp(regex.source, `${regex.flags}g`);
	const matches = Array.from(parseString(value).matchAll(globalRegex));
	const groups = matches.flatMap((match) => match.slice(1));
	const validated = z.array(z.string()).parse(groups);

	if (validated.length === 0) {
		throw new Error(errorMessage);
	}

	return {
		groups: validated as [string, ...string[]],
		captures: matches[0]?.groups ?? {},
	};
}

export async function isStateMatching(options: {
	packageIdentifier: string;
	state: string;
	ignoreQuotes?: boolean;
}) {
	if (process.env.DRY_RUN) return;
	const versionStatePath = `version-state/${options.packageIdentifier}`;
	const storedVersion = (await fs.ref(versionStatePath).text()).trim();

	if (options.ignoreQuotes) {
		return options.state.replaceAll(/["']/g, '') === storedVersion.replaceAll(/["']/g, '');
	}

	return options.state === storedVersion;
}

export async function checkVersionInRepo(options: {
	version: string;
	packageIdentifier: string;
	logger?: Logger;
	font?: boolean;
	ignoreOtherPrs?: boolean;
}) {
	if (process.env.DRY_RUN) return false;
	const logger = options.logger ?? new Logger();

	const { owner, repo, branch } = getTargetRepository();

	const manifestDirectory = options.font ? 'fonts' : 'manifests';
	const JSDELIVR_MANIFEST_ROOT = `https://cdn.jsdelivr.net/gh/${owner}/${repo}@${branch}/${manifestDirectory}`;
	const GITHUB_MANIFEST_ROOT = `https://raw.githubusercontent.com/${owner}/${repo}/${branch}/${manifestDirectory}`;
	const MANIFEST_PATH = `${options.packageIdentifier.charAt(0).toLowerCase()}/${options.packageIdentifier
		.split('.')
		.join('/')}/${options.version}/${options.packageIdentifier}.yaml`;
	const jsdelivrUrl = `${JSDELIVR_MANIFEST_ROOT}/${MANIFEST_PATH}`;
	const githubUrl = `${GITHUB_MANIFEST_ROOT}/${MANIFEST_PATH}`;

	const response = options.ignoreOtherPrs
		? await ky.get(githubUrl, {
				cache: 'no-store',
				throwHttpErrors: false,
			})
		: await ky.head(jsdelivrUrl, {
				cache: 'no-store',
				throwHttpErrors: false,
			});

	if (response.ok && !process.env.DRY_RUN && !options.ignoreOtherPrs) {
		logger.present(options.version);
		return true;
	}

	if (
		response.ok &&
		options.ignoreOtherPrs &&
		(await response.text()).includes('# Created by Anthelion')
	) {
		logger.present(options.version);
		return true;
	}

	const existingPR = await komac.findPullRequest({
		packageIdentifier: options.packageIdentifier,
		version: options.version,
		authoredByCurrentUserOnly: options.ignoreOtherPrs,
	});

	if (options.ignoreOtherPrs && existingPR && existingPR.state === 'closed') {
		return false;
	}
	if (existingPR) {
		logger.prExists(existingPR);
		return true;
	}

	return false;
}

export async function updateVersionState(options: { packageIdentifier: string; state: string }) {
	if (process.env.DRY_RUN) return;

	const versionStatePath = `version-state/${options.packageIdentifier}`;
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
				headline: `[ci skip] Update ${options.packageIdentifier} version state`,
			},
			fileChanges: {
				additions: [
					{
						path: versionStatePath,
						contents: btoa(options.state),
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

export function resolveDataBackedUrls(options: {
	installers: UpdatePackageRequest['installers'];
	data: unknown;
}) {
	return options.installers.map((installer) => {
		if (typeof installer === 'string') {
			return isHttpUrl(installer) ? installer : parseString(getPath(options.data, installer));
		}

		return {
			...installer,
			url: isHttpUrl(installer.url)
				? installer.url
				: parseString(getPath(options.data, installer.url)),
		};
	});
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
