import { cerebras } from '@ai-sdk/cerebras';
import { getFormattedGithubReleaseNotes, htmlToPlainText } from '@unownplain/anthelion-komac';
import { generateText, Output } from 'ai';
import { getProperty } from 'dot-prop';
import ky from 'ky';
import { parse } from 'yaml';
import { z } from 'zod';

import { isHttpUrl, vs } from '@/helpers.ts';
import { type JsonTask } from '@/schema/json-task';
import { normalizedReleaseNotesSchema, ReleaseNotesSource } from '@/schema/release-notes';

const CleanupResultSchema = z.object({
	releaseNotes: z.string(),
	error: z.boolean().optional(),
});

const CLEANUP_SYSTEM_PROMPT = `
		Your goal is to format release notes from HTML, markdown, XML, or unclean text into plain text (NOT MARKDOWN) suitable for viewing in terminals.

		Unless the context exceeds 10000 characters, do not summarize the content and format the text verbatim.
		Place newlines between headers but not between bullet points.

		Remove any unnecessary info such as:
		- Headers such as "Release Notes", "{app_name} Release Notes", "{app_name} Release", "X.X.X Release", "{app_name} version", etc.
		- Any checksum (SHA256, etc.) sections/tables
		- Download methods/commands/how to download
		- Released on dates
		- Time to read (X min read)

		Current package version is {version}. Only include the release notes for this version. If there are no release notes for this version, return an error.
	`;

async function cleanupReleaseNotes(releaseNotes: string, version: string) {
	if (!process.env.CEREBRAS_API_KEY) {
		return undefined;
	}

	const model = cerebras('qwen-3-235b-a22b-instruct-2507');
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

type BrowserRenderingOptions = {
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
	const { CLOUDFLARE_ACCOUNT_ID, CLOUDFLARE_API_TOKEN, CEREBRAS_API_KEY } = process.env;

	if (!CLOUDFLARE_ACCOUNT_ID || !CLOUDFLARE_API_TOKEN || !CEREBRAS_API_KEY) {
		return undefined;
	}

	const endpoint = `https://api.cloudflare.com/client/v4/accounts/${CLOUDFLARE_ACCOUNT_ID}/browser-rendering/json`;
	const response = await ky.post(endpoint, {
		headers: {
			authorization: `Bearer ${CLOUDFLARE_API_TOKEN}`,
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
					authorization: `Bearer ${CEREBRAS_API_KEY}`,
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

export async function resolveReleaseNotes(
	task: JsonTask,
	releaseNotesConfig: z.output<ReturnType<typeof normalizedReleaseNotesSchema>> | undefined,
	version: string,
	githubTag?: string,
) {
	const manifest: {
		releaseNotes: string | undefined;
		releaseNotesUrl: string | undefined;
	} = {
		releaseNotes: undefined,
		releaseNotesUrl: undefined,
	};

	if (!releaseNotesConfig) {
		return manifest;
	}

	manifest.releaseNotesUrl = releaseNotesConfig.releaseNotesUrl;

	if (releaseNotesConfig.kind === 'url-only') {
		return manifest;
	}

	switch (releaseNotesConfig.source) {
		case ReleaseNotesSource.Html: {
			const html = await ky(releaseNotesConfig.sourceUrl).text();
			const htmlPlainText = await htmlToPlainText(html);

			manifest.releaseNotes = applyCharacterLimit(
				htmlPlainText ?? html,
				releaseNotesConfig.characterLimit,
			);

			break;
		}
		case ReleaseNotesSource.Github: {
			const githubConfig = 'github' in task ? task.github : undefined;
			const owner = releaseNotesConfig.owner || githubConfig?.owner;
			const repo = releaseNotesConfig.repo || githubConfig?.repo;
			const tag = releaseNotesConfig.tag ?? githubTag;

			if (!owner || !repo) {
				throw new Error(
					'releaseNotes.github owner and repo are required unless strategy is github-release',
				);
			}
			if (!tag) {
				throw new Error(
					'releaseNotes.tag is required unless strategy is github-release and a GitHub release tag was resolved',
				);
			}

			manifest.releaseNotesUrl = `https://github.com/${owner}/${repo}/releases/tag/${tag}`;
			manifest.releaseNotes =
				(await getFormattedGithubReleaseNotes(owner, repo, tag, process.env.GITHUB_TOKEN)) ??
				undefined;

			break;
		}
		case ReleaseNotesSource.Json: {
			let response = await ky(releaseNotesConfig.sourceUrl).json();
			let rawReleaseNotes = vs(getProperty(response, releaseNotesConfig.path));

			if (isHttpUrl(rawReleaseNotes)) {
				manifest.releaseNotesUrl = rawReleaseNotes;
				rawReleaseNotes = vs(await ky(rawReleaseNotes));
			}

			manifest.releaseNotes = (await htmlToPlainText(rawReleaseNotes)) ?? undefined;

			break;
		}
		case ReleaseNotesSource.Yaml: {
			let response = await ky(releaseNotesConfig.sourceUrl).text();
			let rawReleaseNotes = vs(getProperty(parse(response), releaseNotesConfig.path));

			if (isHttpUrl(rawReleaseNotes)) {
				manifest.releaseNotesUrl = rawReleaseNotes;
				rawReleaseNotes = vs(await ky(rawReleaseNotes));
			}

			manifest.releaseNotes = (await htmlToPlainText(rawReleaseNotes)) ?? undefined;

			break;
		}
		case ReleaseNotesSource.BrowserRendering: {
			manifest.releaseNotes = await fetchBrowserRenderedReleaseNotes(
				{
					url: releaseNotesConfig.sourceUrl,
					waitUntil: releaseNotesConfig.waitUntil,
					waitForSelector: releaseNotesConfig.waitForSelector,
				},
				version,
			);

			break;
		}
	}

	if (!manifest.releaseNotes) {
		manifest.releaseNotesUrl = undefined;
	}

	if ('cleanup' in releaseNotesConfig && releaseNotesConfig.cleanup && manifest.releaseNotes) {
		manifest.releaseNotes = await cleanupReleaseNotes(manifest.releaseNotes, version);
	}

	return manifest;
}
