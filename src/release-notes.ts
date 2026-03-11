import { cerebras } from '@ai-sdk/cerebras';
import { getFormattedGithubReleaseNotes, htmlToPlainText } from '@unownplain/anthelion-komac';
import { generateText, Output } from 'ai';
import { getProperty } from 'dot-prop';
import ky from 'ky';
import { parse } from 'yaml';
import { z } from 'zod';

import { resolveVersionPlaceholders, vs } from '@/helpers.ts';
import { Strategy, type JsonTask } from '@/schema/json-task';
import { ReleaseNotesSource } from '@/schema/release-notes';

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
	if (!process.env.CEREBRAS_API_KEY) {
		return undefined;
	}

	const model = cerebras('gpt-oss-120b');
	const { output } = await generateText({
		model,
		output: Output.object({ schema: CleanupResultSchema }),
		system: CLEANUP_SYSTEM_PROMPT.replaceAll('{version}', version),
		prompt: releaseNotes,
		temperature: 0,
	});

	return output.error ? undefined : output.releaseNotes;
}

function applyCharacterLimit(releaseNotes: string, characterLimit: number | undefined) {
	if (!characterLimit || releaseNotes.length <= characterLimit) {
		return releaseNotes;
	}

	return releaseNotes.slice(0, characterLimit).trim();
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

export async function resolveReleaseNotes(
	task: JsonTask,
	version: string,
	options?: { githubTag?: string },
) {
	if (!task.releaseNotes) {
		return { releaseNotesUrl: undefined, releaseNotes: undefined };
	}

	if (!('source' in task.releaseNotes)) {
		return {
			releaseNotesUrl: resolveVersionPlaceholders(task.releaseNotes.url, version),
			releaseNotes: undefined,
		};
	}

	switch (task.releaseNotes.source) {
		case ReleaseNotesSource.Html: {
			const sourceUrl = resolveVersionPlaceholders(task.releaseNotes.sourceUrl, version);
			const releaseNotesUrl = task.releaseNotes.releaseNotesUrl
				? resolveVersionPlaceholders(task.releaseNotes.releaseNotesUrl, version)
				: sourceUrl;
			const html = await ky(sourceUrl).text();

			let releaseNotes: string | undefined = applyCharacterLimit(
				(await htmlToPlainText(html)) ?? html,
				task.releaseNotes.characterLimit,
			);

			if (task.releaseNotes.cleanup) {
				releaseNotes = await cleanupReleaseNotes(releaseNotes, version);
			}

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

			const tag = task.releaseNotes.tag
				? resolveVersionPlaceholders(task.releaseNotes.tag, version)
				: options?.githubTag;

			if (!tag) {
				throw new Error(
					'releaseNotes.tag is required unless strategy is github-release and a GitHub release tag was resolved',
				);
			}
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
			const sourceUrl = resolveVersionPlaceholders(task.releaseNotes.sourceUrl, version);
			const configuredReleaseNotesUrl = task.releaseNotes.releaseNotesUrl
				? resolveVersionPlaceholders(task.releaseNotes.releaseNotesUrl, version)
				: undefined;
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
			const sourceUrl = resolveVersionPlaceholders(task.releaseNotes.sourceUrl, version);
			const configuredReleaseNotesUrl = task.releaseNotes.releaseNotesUrl
				? resolveVersionPlaceholders(task.releaseNotes.releaseNotesUrl, version)
				: undefined;
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
			const sourceUrl = resolveVersionPlaceholders(task.releaseNotes.sourceUrl, version);
			const releaseNotesUrl = task.releaseNotes.releaseNotesUrl
				? resolveVersionPlaceholders(task.releaseNotes.releaseNotesUrl, version)
				: sourceUrl;
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
				releaseNotes,
			};
		}
	}
}
