import { cerebras } from '@ai-sdk/cerebras';
import fs from '@rcompat/fs';
import {
	getExistingPullRequest,
	getFormattedGithubReleaseNotes,
	htmlToPlainText,
	type ExistingPullRequestResult,
	type UpdateVersionResult,
} from '@unownplain/anthelion-komac';
import { generateText, Output } from 'ai';
import { bgRed, blue, green, redBright, yellow } from 'ansis';
import { getProperty } from 'dot-prop';
import { delay } from 'es-toolkit';
import ky from 'ky';
import { parse } from 'yaml';
import { z, ZodError } from 'zod';

import { octokit, getRepoHeadSha } from '@/github.ts';
import { ReleaseNotesSource, Strategy, type JsonTask } from '@/schema/task/schema';

export class Logger {
	private logs: string[] = [];

	log(line: string) {
		this.logs.push(line);
	}

	logUpdateResult(result: UpdateVersionResult) {
		for (const file of result.changes) {
			this.logs.push(file.content);
		}
		this.logs.push(
			`Pull request URL: ${result.pullRequestUrl ? result.pullRequestUrl : 'Dry Run'}\n`,
		);
	}

	stateMatches(version: string) {
		this.logs.push(green`Stored state matches latest state. (${version})\n`);
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

	prExists(pr: ExistingPullRequestResult) {
		this.log(yellow`There is already a PR with state ${pr.state} created at ${pr.createdAt}.`);
		this.log(pr.pullRequestUrl + '\n');
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

export async function isStateMatching(packageIdentifier: string, newState: string) {
	if (process.env.DRY_RUN) return;
	const versionStatePath = `version_state/${packageIdentifier}`;
	const storedVersion = (await new fs.FileRef(versionStatePath).text()).trim();

	return newState === storedVersion;
}

export async function checkVersionInRepo(
	version: string,
	packageIdentifier: string,
	logger = new Logger(),
) {
	if (process.env.DRY_RUN) return false;

	const MANIFEST_URL =
		'https://raw.githubusercontent.com/microsoft/winget-pkgs/refs/heads/master/manifests';
	const manifestPath = `${MANIFEST_URL}/${packageIdentifier.charAt(0).toLowerCase()}/${packageIdentifier
		.split('.')
		.join('/')}/${version}/${packageIdentifier}.yaml`;

	const response = await ky(manifestPath, {
		method: 'head',
		throwHttpErrors: false,
	});

	if (response.ok && !process.env.DRY_RUN) {
		logger.present(version);
		return true;
	}

	const existingPR = await getExistingPullRequest({
		packageIdentifier,
		version,
		token: process.env.GITHUB_TOKEN!,
	});

	if (existingPR) {
		logger.prExists(existingPR);
		return true;
	}
}

export async function closeAllButMostRecentPR(packageIdentifier: string) {
	if (process.env.DRY_RUN) return;

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

export async function updateVersionState(packageIdentifier: string, latestVersion: string) {
	if (process.env.DRY_RUN) return;

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

const CleanupResultSchema = z.object({
	releaseNotes: z.string(),
	error: z.boolean().optional(),
});

const CLEANUP_SYSTEM_PROMPT = `
		Your goal is to format release notes from HTML, markdown, XML, or unclean text into plain text (NOT MARKDOWN) suitable for viewing in terminals.

		Unless the context exceeds 10000 characters, do not summarize the content and format the text verbatim.

		Remove any unnecessary info such as:
		- Headers such as "Release Notes", "{app_name} Release Notes", "{app_name} Release", "X.X.X Release", "{app_name} version", etc.
		- Any checksum (SHA256, etc.) sections/tables
		- Download methods/commands/how to download
		- Released on dates
		- Time to read (X min read)
		- Images / videos and alt text

		Current package version is {version}. Only include the release notes for this version. If there are no release notes for this version, return an error.
	`;

async function cleanupReleaseNotes(releaseNotes: string, version: string) {
	const apiKey = process.env.CEREBRAS_API_KEY;

	if (!apiKey) {
		return undefined;
	}

	const model = cerebras('gpt-oss-120b');
	const { output } = await generateText({
		model,
		output: Output.object({ schema: CleanupResultSchema }),
		system: CLEANUP_SYSTEM_PROMPT.replaceAll('{version}', version),
		prompt: releaseNotes,
	});

	return output.error ? undefined : output.releaseNotes;
}

function applyCharacterLimit(releaseNotes: string, characterLimit: number | undefined) {
	if (!characterLimit || releaseNotes.length <= characterLimit) {
		return releaseNotes;
	}

	return releaseNotes.slice(0, characterLimit).trimEnd();
}

function isHttpUrl(value: string) {
	return z.url().safeParse(value).success;
}

type BrowserRenderingOptions = {
	accountId: string;
	apiToken: string;
	aiToken: string;
	cacheTtl?: number;
	url: string;
	waitUntil?: 'load' | 'domcontentloaded' | 'networkidle0' | 'networkidle2';
	waitForSelector?: string;
};

type BrowserRenderingJsonEnvelope = {
	success: boolean;
	errors?: Array<{ code: number; message: string }>;
	result?: unknown;
};

async function fetchBrowserRenderedReleaseNotes(options: BrowserRenderingOptions, version: string) {
	const endpoint = `https://api.cloudflare.com/client/v4/accounts/${options.accountId}/browser-rendering/json`;
	const response = await ky.post(endpoint, {
		headers: {
			authorization: `Bearer ${options.apiToken}`,
		},
		json: {
			url: options.url,
			prompt: CLEANUP_SYSTEM_PROMPT.replaceAll('{version}', version),
			response_format: {
				type: 'json_schema',
				json_schema: {
					name: 'release_notes',
					schema: z.toJSONSchema(CleanupResultSchema, { target: 'openapi-3.0' }),
					strict: true,
				},
			},
			custom_ai: [
				{
					model: 'cerebras/gpt-oss-120b',
					authorization: `Bearer ${options.aiToken}`,
				},
			],
		},
		throwHttpErrors: false,
	});

	const data = (await response.json()) as BrowserRenderingJsonEnvelope;
	if (!response.ok || !data.success || !data.result) {
		const errorMessage =
			data.errors?.[0]?.message ?? 'Unknown error from Cloudflare Browser Rendering';
		throw new Error(`Cloudflare Browser Rendering failed: ${errorMessage}`);
	}

	const parsed = CleanupResultSchema.parse(data.result);
	return parsed.error ? undefined : parsed.releaseNotes;
}

async function resolveNotesContentAndUrl(rawValue: string, releaseNotesUrl: string | undefined) {
	let sourceContent = rawValue;
	let resolvedReleaseNotesUrl = releaseNotesUrl;

	if (isHttpUrl(rawValue)) {
		sourceContent = await ky(rawValue).text();
		if (!resolvedReleaseNotesUrl) {
			resolvedReleaseNotesUrl = rawValue;
		}
	}

	const releaseNotes = (await htmlToPlainText(sourceContent)) ?? sourceContent;

	return { releaseNotes, releaseNotesUrl: resolvedReleaseNotesUrl };
}

export async function resolveReleaseNotes(task: JsonTask, version: string) {
	if (!task.releaseNotes) {
		return { releaseNotesUrl: undefined, releaseNotes: undefined };
	}

	if (!('source' in task.releaseNotes)) {
		return {
			releaseNotesUrl: task.releaseNotes.url.replaceAll('{version}', version),
			releaseNotes: undefined,
		};
	}

	switch (task.releaseNotes.source) {
		case ReleaseNotesSource.Html: {
			const sourceUrl = task.releaseNotes.sourceUrl.replaceAll('{version}', version);
			const releaseNotesUrl =
				task.releaseNotes.releaseNotesUrl?.replaceAll('{version}', version) ?? sourceUrl;
			const html = await ky(sourceUrl).text();

			let releaseNotes: string | undefined = applyCharacterLimit(
				(await htmlToPlainText(html)) ?? html,
				task.releaseNotes.characterLimit,
			);

			if (task.releaseNotes.cleanup) {
				releaseNotes = await cleanupReleaseNotes(releaseNotes, version);
			}

			releaseNotes = releaseNotes
				? applyCharacterLimit(releaseNotes, task.releaseNotes.characterLimit)
				: undefined;

			return { releaseNotesUrl, releaseNotes };
		}
		case ReleaseNotesSource.Github: {
			const owner =
				task.releaseNotes.owner ||
				(task.strategy === Strategy.GithubRelease ? task.github.owner : undefined);
			const repo =
				task.releaseNotes.repo ||
				(task.strategy === Strategy.GithubRelease ? task.github.repo : undefined);

			if (!owner || !repo) {
				throw new Error(
					'releaseNotes.github owner and repo are required unless strategy is github-release',
				);
			}

			const tag = task.releaseNotes.tag?.replaceAll('{version}', version);
			const releaseNotesUrl = `https://github.com/${owner}/${repo}/releases/tag/${tag}`;
			const githubNotes = await getFormattedGithubReleaseNotes(
				owner,
				repo,
				tag,
				process.env.GITHUB_TOKEN,
			);

			if (!githubNotes) {
				return { releaseNotesUrl, releaseNotes: undefined };
			}
			if (!task.releaseNotes.cleanup) {
				return { releaseNotesUrl, releaseNotes: githubNotes };
			}

			const releaseNotes: string | undefined = await cleanupReleaseNotes(githubNotes, version);
			return { releaseNotesUrl, releaseNotes };
		}
		case ReleaseNotesSource.Json: {
			const sourceUrl = task.releaseNotes.sourceUrl.replaceAll('{version}', version);
			const configuredReleaseNotesUrl = task.releaseNotes.releaseNotesUrl?.replaceAll(
				'{version}',
				version,
			);
			const response = await ky(sourceUrl).json();
			const rawReleaseNotes = vs(getProperty(response, task.releaseNotes.path));
			const resolved = await resolveNotesContentAndUrl(rawReleaseNotes, configuredReleaseNotesUrl);
			let releaseNotes: string | undefined = resolved.releaseNotes;

			if (task.releaseNotes.cleanup) {
				releaseNotes = await cleanupReleaseNotes(releaseNotes, version);
			}

			return { releaseNotesUrl: resolved.releaseNotesUrl, releaseNotes };
		}
		case ReleaseNotesSource.Yaml: {
			const sourceUrl = task.releaseNotes.sourceUrl.replaceAll('{version}', version);
			const configuredReleaseNotesUrl = task.releaseNotes.releaseNotesUrl?.replaceAll(
				'{version}',
				version,
			);
			const response = await ky(sourceUrl).text();
			const yaml = parse(response, { schema: 'failsafe' });
			const rawReleaseNotes = vs(getProperty(yaml, task.releaseNotes.path));
			const resolved = await resolveNotesContentAndUrl(rawReleaseNotes, configuredReleaseNotesUrl);
			let releaseNotes: string | undefined = resolved.releaseNotes;

			if (task.releaseNotes.cleanup) {
				releaseNotes = await cleanupReleaseNotes(releaseNotes, version);
			}

			return { releaseNotesUrl: resolved.releaseNotesUrl, releaseNotes };
		}
		case ReleaseNotesSource.BrowserRendering: {
			const sourceUrl = task.releaseNotes.sourceUrl.replaceAll('{version}', version);
			const releaseNotesUrl =
				task.releaseNotes.releaseNotesUrl?.replaceAll('{version}', version) ?? sourceUrl;
			const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
			const apiToken = process.env.CLOUDFLARE_API_TOKEN;
			const aiToken = process.env.CEREBRAS_API_KEY;

			if (!accountId || !apiToken || !aiToken) {
				return {
					releaseNotesUrl,
					releaseNotes: undefined,
				};
			}

			const releaseNotes = await fetchBrowserRenderedReleaseNotes(
				{
					accountId,
					apiToken,
					aiToken,
					url: sourceUrl,
					waitUntil: task.releaseNotes.waitUntil,
					waitForSelector: task.releaseNotes.waitForSelector,
				},
				version,
			);

			return {
				releaseNotesUrl,
				releaseNotes: releaseNotes
					? applyCharacterLimit(releaseNotes, task.releaseNotes.characterLimit)
					: undefined,
			};
		}
	}
}
