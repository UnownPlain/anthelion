import { groq } from '@ai-sdk/groq';
import {
	getFormattedGithubReleaseNotes,
	htmlToPlainText,
	markdownToPlainText,
} from '@unownplain/anthelion-komac';
import { generateText } from 'ai';
import ky from 'ky';
import { parse } from 'yaml';

import { dedent, get, isHttpUrl, resolveValuePlaceholders, vs } from '@/helpers.ts';
import {
	browserRenderingOptionsSchema,
	browserRenderingResponseSchema,
	type BrowserRenderingOptions,
} from '@/schema/browser-rendering';
import {
	releaseNotesSchema,
	ReleaseNotesSource,
	type NestedReleaseNotesSource,
	type ReleaseNotesConfig,
} from '@/schema/release-notes';

const CLEANUP_SYSTEM_PROMPT = dedent`
	Your goal is to format release notes from HTML, markdown, XML, or unclean text into plain text suitable for viewing in terminals.

	Return only the cleaned plain text. Do not return JSON, markdown fences, commentary, or an explanation. Return an empty response if the input does not contain release notes for the requested package and version.

	Do not summarize the content and format the text verbatim. Place newlines between headers but not between bullet points.

	Remove any unnecessary info such as:
	- Headers such as "Release Notes", "<app_name> Release Notes", "<app_name> Release", "<version>", "<app_name> version", etc.
	- Any checksum (SHA256, etc.) sections/tables
	- Download methods/commands/how to download
	- Released on dates
	- Time to read (X min read)

	The package identifier is {packageIdentifier} and current package version is {version}. Only include the release notes for this version and package. If the package or version is not specified, assume it is the correct version or package.
`;

type ResolvedReleaseNotes = {
	releaseNotes: string | undefined;
	releaseNotesUrl: string | undefined;
};

type SourceConfig = Extract<NonNullable<ReleaseNotesConfig>, { source: ReleaseNotesSource }>;
type DataSourceConfig = Extract<
	SourceConfig,
	{ source: ReleaseNotesSource.Json | ReleaseNotesSource.Yaml }
>;

async function cleanupReleaseNotes(
	releaseNotes: string,
	version: string,
	packageIdentifier: string,
	characterLimit?: number,
) {
	if (!process.env.GROQ_API_KEY) {
		return;
	}

	const { text } = await generateText({
		model: groq('openai/gpt-oss-120b'),
		system: CLEANUP_SYSTEM_PROMPT.replaceAll('{version}', version).replaceAll(
			'{packageIdentifier}',
			packageIdentifier,
		),
		prompt: limitLength(releaseNotes, characterLimit),
		temperature: 0,
	});

	return text.trim() || undefined;
}

function emptyReleaseNotes(): ResolvedReleaseNotes {
	return {
		releaseNotes: undefined,
		releaseNotesUrl: undefined,
	};
}

function limitLength(releaseNotes: string, characterLimit?: number) {
	return characterLimit && releaseNotes.length > characterLimit
		? releaseNotes.slice(0, characterLimit).trim()
		: releaseNotes;
}

async function formatReleaseNotes(content: string, source: NestedReleaseNotesSource) {
	switch (source) {
		case ReleaseNotesSource.Markdown:
			return (await markdownToPlainText(content)) ?? content;
		case ReleaseNotesSource.Html:
			return (await htmlToPlainText(content)) ?? content;
		case ReleaseNotesSource.PlainText:
			return content;
	}
}

async function fetchBrowserRenderedMarkdown(options: BrowserRenderingOptions) {
	const parsedOptions = browserRenderingOptionsSchema.parse(options);
	const { CLOUDFLARE_ACCOUNT_ID, CLOUDFLARE_API_TOKEN } = process.env;

	if (!CLOUDFLARE_ACCOUNT_ID || !CLOUDFLARE_API_TOKEN) {
		return;
	}

	const endpoint = `https://api.cloudflare.com/client/v4/accounts/${CLOUDFLARE_ACCOUNT_ID}/browser-rendering/markdown`;
	const requestBody = {
		url: parsedOptions.url,
		...(parsedOptions.waitUntil && {
			gotoOptions: { waitUntil: parsedOptions.waitUntil },
		}),
		...(parsedOptions.waitForSelector && {
			waitForSelector: parsedOptions.waitForSelector,
		}),
	};

	const response = await ky.post(endpoint, {
		headers: {
			authorization: `Bearer ${CLOUDFLARE_API_TOKEN}`,
		},
		json: requestBody,
		throwHttpErrors: false,
	});

	const data = browserRenderingResponseSchema.safeParse(await response.json()).data;
	if (!response.ok || !data?.success || typeof data.result !== 'string') {
		const errorMessage =
			data?.errors?.[0]?.message ?? 'Unknown error from Cloudflare Browser Rendering';
		throw new Error(`Cloudflare Browser Rendering failed: ${errorMessage}`);
	}

	return data.result;
}

async function resolveNestedReleaseNotes(
	sourceUrl: string,
	config: Pick<DataSourceConfig, 'path' | 'nestedSource' | 'source'>,
) {
	const response =
		config.source === ReleaseNotesSource.Json
			? await ky(sourceUrl).json()
			: parse(await ky(sourceUrl).text());
	let rawReleaseNotes = vs(get(response, config.path));
	let releaseNotesUrl: string | undefined;

	if (isHttpUrl(rawReleaseNotes)) {
		releaseNotesUrl = rawReleaseNotes;
		rawReleaseNotes = vs(await ky(rawReleaseNotes).text());
	}

	return {
		releaseNotes: await formatReleaseNotes(rawReleaseNotes, config.nestedSource),
		releaseNotesUrl,
	};
}

function resolveSourceUrls(
	config: { sourceUrl: string; releaseNotesUrl?: string },
	values: Record<string, unknown>,
) {
	const sourceUrl = resolveValuePlaceholders(config.sourceUrl, values);
	const releaseNotesUrl = config.releaseNotesUrl
		? resolveValuePlaceholders(config.releaseNotesUrl, values)
		: sourceUrl;

	return { sourceUrl, releaseNotesUrl };
}

async function resolveFromSource(
	config: SourceConfig,
	values: Record<string, unknown>,
	githubTag?: string,
	github?: { owner: string; repo: string },
): Promise<ResolvedReleaseNotes> {
	switch (config.source) {
		case ReleaseNotesSource.Html:
		case ReleaseNotesSource.Markdown:
		case ReleaseNotesSource.PlainText: {
			const { sourceUrl, releaseNotesUrl } = resolveSourceUrls(config, values);
			const releaseNotes = await formatReleaseNotes(await ky(sourceUrl).text(), config.source);

			return {
				releaseNotes,
				releaseNotesUrl,
			};
		}
		case ReleaseNotesSource.Github: {
			const owner = config.owner || github?.owner;
			const repo = config.repo || github?.repo;
			const tag = config.tag ? resolveValuePlaceholders(config.tag, values) : githubTag;

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

			return {
				releaseNotes: (await getFormattedGithubReleaseNotes(owner, repo, tag)) ?? undefined,
				releaseNotesUrl: `https://github.com/${owner}/${repo}/releases/tag/${tag}`,
			};
		}
		case ReleaseNotesSource.Json:
		case ReleaseNotesSource.Yaml: {
			const { sourceUrl, releaseNotesUrl } = resolveSourceUrls(config, values);
			const nested = await resolveNestedReleaseNotes(sourceUrl, config);

			return {
				releaseNotes: nested.releaseNotes,
				releaseNotesUrl: nested.releaseNotesUrl ?? releaseNotesUrl,
			};
		}
		case ReleaseNotesSource.BrowserRendering: {
			const { sourceUrl, releaseNotesUrl } = resolveSourceUrls(config, values);
			const renderedMarkdown = await fetchBrowserRenderedMarkdown({
				url: sourceUrl,
				waitUntil: config.waitUntil,
				waitForSelector: config.waitForSelector,
			});

			return {
				releaseNotes:
					renderedMarkdown === undefined
						? undefined
						: await formatReleaseNotes(renderedMarkdown, ReleaseNotesSource.Markdown),
				releaseNotesUrl,
			};
		}
	}
}

export async function resolveReleaseNotes(
	releaseNotes: unknown,
	packageIdentifier: string,
	version: string,
	githubTag?: string,
	github?: {
		owner: string;
		repo: string;
	},
	templateValues: Record<string, unknown> = {},
) {
	const releaseNotesConfig = releaseNotesSchema.parse(releaseNotes);

	if (!releaseNotesConfig) {
		return emptyReleaseNotes();
	}

	const values = { ...templateValues, version };

	if (!('source' in releaseNotesConfig)) {
		return {
			releaseNotes: undefined,
			releaseNotesUrl: resolveValuePlaceholders(releaseNotesConfig.releaseNotesUrl, values),
		};
	}

	const manifest = await resolveFromSource(releaseNotesConfig, values, githubTag, github);

	if (!manifest.releaseNotes) {
		return emptyReleaseNotes();
	}

	if (releaseNotesConfig.cleanup ?? true) {
		const cleanedReleaseNotes = await cleanupReleaseNotes(
			manifest.releaseNotes,
			version,
			packageIdentifier,
			'characterLimit' in releaseNotesConfig ? releaseNotesConfig.characterLimit : undefined,
		);

		return cleanedReleaseNotes
			? { ...manifest, releaseNotes: cleanedReleaseNotes }
			: emptyReleaseNotes();
	}

	return manifest;
}
