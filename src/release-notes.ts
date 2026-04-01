import { groq } from '@ai-sdk/groq';
import {
	getFormattedGithubReleaseNotes,
	htmlToPlainText,
	markdownToPlainText,
} from '@unownplain/anthelion-komac';
import { generateText, Output } from 'ai';
import ky from 'ky';
import { parse } from 'yaml';
import { z } from 'zod';

import { get, isHttpUrl, vs } from '@/helpers.ts';
import { normalizedReleaseNotesSchema, ReleaseNotesSource } from '@/schema/release-notes';

type ReleaseNotesTaskContext = {
	github?: {
		owner: string;
		repo: string;
	};
};

const CleanupResultSchema = z.object({
	releaseNotes: z.string(),
	error: z.boolean(),
});

const CLEANUP_SYSTEM_PROMPT = `
		Your goal is to format release notes from HTML, markdown, XML, or unclean text into plain text (NOT MARKDOWN) suitable for viewing in terminals.

		Unless the context exceeds 10000 characters, do not summarize the content and format the text verbatim.
		Place newlines between headers but not between bullet points.

		Remove any unnecessary info such as:
		- Headers such as "Release Notes", "<app_name> Release Notes", "<app_name> Release", "<version>", "<app_name> version", etc.
		- Any checksum (SHA256, etc.) sections/tables
		- Download methods/commands/how to download
		- Released on dates
		- Time to read (X min read)

		Current package version is {version}. Only include the release notes for this version. If there are no release notes for this version, return an error.
	`;

async function cleanupReleaseNotes(releaseNotes: string, version: string) {
	if (!process.env.GROQ_API_KEY) {
		return undefined;
	}

	const model = groq('openai/gpt-oss-120b');
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
	url: string;
	waitUntil?: 'load' | 'domcontentloaded' | 'networkidle0' | 'networkidle2';
	waitForSelector?: string;
};

type BrowserRenderingMarkdownEnvelope = {
	success: boolean;
	errors?: Array<{ code: number; message: string }>;
	result?: string;
};

async function fetchBrowserRenderedMarkdown(options: BrowserRenderingOptions) {
	const { CLOUDFLARE_ACCOUNT_ID, CLOUDFLARE_API_TOKEN } = process.env;

	if (!CLOUDFLARE_ACCOUNT_ID || !CLOUDFLARE_API_TOKEN) {
		return undefined;
	}

	const endpoint = `https://api.cloudflare.com/client/v4/accounts/${CLOUDFLARE_ACCOUNT_ID}/browser-rendering/markdown`;
	const requestBody: {
		gotoOptions?: {
			waitUntil?: BrowserRenderingOptions['waitUntil'];
		};
		url: string;
		waitForSelector?: string;
	} = {
		url: options.url,
	};

	if (options.waitUntil) {
		requestBody.gotoOptions = {
			waitUntil: options.waitUntil,
		};
	}

	if (options.waitForSelector) {
		requestBody.waitForSelector = options.waitForSelector;
	}

	const response = await ky.post(endpoint, {
		headers: {
			authorization: `Bearer ${CLOUDFLARE_API_TOKEN}`,
		},
		json: {
			...requestBody,
		},
		throwHttpErrors: false,
	});

	const data = (await response.json()) as BrowserRenderingMarkdownEnvelope;
	if (!response.ok || !data.success || typeof data.result !== 'string') {
		const errorMessage =
			data.errors?.[0]?.message ?? 'Unknown error from Cloudflare Browser Rendering';
		throw new Error(`Cloudflare Browser Rendering failed: ${errorMessage}`);
	}

	return data.result;
}

export async function resolveReleaseNotes(
	task: ReleaseNotesTaskContext,
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
		case ReleaseNotesSource.Markdown: {
			const markdown = await ky(releaseNotesConfig.sourceUrl).text();
			const markdownPlainText = await markdownToPlainText(markdown);

			manifest.releaseNotes = applyCharacterLimit(
				markdownPlainText ?? markdown,
				releaseNotesConfig.characterLimit,
			);

			break;
		}
		case ReleaseNotesSource.PlainText: {
			const plainText = await ky(releaseNotesConfig.sourceUrl).text();

			manifest.releaseNotes = applyCharacterLimit(plainText, releaseNotesConfig.characterLimit);

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
			let rawReleaseNotes = vs(get(response, releaseNotesConfig.path));

			if (isHttpUrl(rawReleaseNotes)) {
				manifest.releaseNotesUrl = rawReleaseNotes;
				rawReleaseNotes = vs(await ky(rawReleaseNotes).text());
			}

			manifest.releaseNotes = (await htmlToPlainText(rawReleaseNotes)) ?? undefined;

			break;
		}
		case ReleaseNotesSource.Yaml: {
			let response = await ky(releaseNotesConfig.sourceUrl).text();
			let rawReleaseNotes = vs(get(parse(response), releaseNotesConfig.path));

			if (isHttpUrl(rawReleaseNotes)) {
				manifest.releaseNotesUrl = rawReleaseNotes;
				rawReleaseNotes = vs(await ky(rawReleaseNotes).text());
			}

			manifest.releaseNotes = (await htmlToPlainText(rawReleaseNotes)) ?? undefined;

			break;
		}
		case ReleaseNotesSource.BrowserRendering: {
			const renderedMarkdown = await fetchBrowserRenderedMarkdown({
				url: releaseNotesConfig.sourceUrl,
				waitUntil: releaseNotesConfig.waitUntil,
				waitForSelector: releaseNotesConfig.waitForSelector,
			});

			if (renderedMarkdown !== undefined) {
				const markdownPlainText = await markdownToPlainText(renderedMarkdown);
				manifest.releaseNotes = applyCharacterLimit(
					markdownPlainText ?? renderedMarkdown,
					releaseNotesConfig.characterLimit,
				);
			}

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
