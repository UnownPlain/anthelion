import { parseYaml, releaseNotesToPlainText } from '@unownplain/anthelion-komac';
import { generateText, type LanguageModel, type ModelMessage } from 'ai';
import { limitAsync } from 'es-toolkit';
import ky from 'ky';

import { config, komac } from '@/config';
import { dedent, getPath, isHttpUrl, parseString, resolveValuePlaceholders } from '@/helpers.ts';
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

	Format the text verbatim. Place newlines between headers but not between bullet points.

	Remove any unnecessary info such as:
	- Headers such as "Release Notes", "<app_name> Release Notes", "<app_name> Release", "<version>", "<app_name> version", etc.
	- Any checksum (SHA256, etc.) sections/tables
	- Download methods/commands/how to download
	- Released on dates
	- Time to read (X min read)

	The package identifier is {packageIdentifier} and current package version is {version}. Only include the release notes for this version and package. If the package or version is not specified, assume it is the correct version or package.
`;

const MAX_RELEASE_NOTES_LENGTH = 10_000;

type ResolvedReleaseNotes = {
	releaseNotes: string | undefined;
	releaseNotesUrl: string | undefined;
};

type SourceConfig = Extract<NonNullable<ReleaseNotesConfig>, { source: ReleaseNotesSource }>;
type DataSourceConfig = Extract<
	SourceConfig,
	{ source: ReleaseNotesSource.Json | ReleaseNotesSource.Yaml }
>;

let cleanup:
	| ((
			model: LanguageModel,
			system: string,
			messages: ModelMessage[],
	  ) => ReturnType<typeof generateText>)
	| undefined;

export async function cleanupReleaseNotes(
	releaseNotes: string,
	version: string,
	packageIdentifier: string,
	characterLimit?: number,
) {
	const cleanupConfig = config.releaseNotes;
	if (!cleanupConfig?.model) {
		return;
	}
	cleanup ??= limitAsync(
		(model: LanguageModel, system: string, messages: ModelMessage[]) =>
			generateText({ model, system, messages }),
		cleanupConfig.concurrency,
	);
	const model =
		typeof cleanupConfig.model === 'function' ? cleanupConfig.model() : cleanupConfig.model;

	const system = CLEANUP_SYSTEM_PROMPT.replaceAll('{version}', version).replaceAll(
		'{packageIdentifier}',
		packageIdentifier,
	);
	const messages: ModelMessage[] = [
		{ role: 'user', content: limitLength(releaseNotes, characterLimit) },
	];
	let result = await cleanup(model, system, [...messages]);
	let text = result.text.trim();

	if (text.length > MAX_RELEASE_NOTES_LENGTH && /\bfull\s+change\s*log\b/i.test(text)) {
		messages.push(...result.responseMessages, {
			role: 'user',
			content:
				'Remove the full changelog section, including its heading and contents. Preserve the rest of the release notes verbatim.',
		});
		result = await cleanup(model, system, [...messages]);
		text = result.text.trim();
	}

	if (text.length > MAX_RELEASE_NOTES_LENGTH) {
		messages.push(...result.responseMessages, {
			role: 'user',
			content: `Summarize these release notes to under ${MAX_RELEASE_NOTES_LENGTH} characters. Prioritize the main changes, fixes, and breaking changes. Return only the plain-text summary.`,
		});
		result = await cleanup(model, system, [...messages]);
		text = result.text.trim();
	}

	return limitLength(text, MAX_RELEASE_NOTES_LENGTH) || undefined;
}

function emptyReleaseNotes() {
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
			return (await releaseNotesToPlainText(content, 'markdown')) ?? content;
		case ReleaseNotesSource.Html:
			return (await releaseNotesToPlainText(content, 'html')) ?? content;
		case ReleaseNotesSource.PlainText:
			return content;
	}
}

async function fetchBrowserRenderedMarkdown(options: BrowserRenderingOptions) {
	const parsedOptions = browserRenderingOptionsSchema.parse(options);
	const credentials = config.browserRendering;

	if (!credentials?.apiToken) {
		return;
	}

	const endpoint = `https://api.cloudflare.com/client/v4/accounts/${credentials.accountId}/browser-rendering/markdown`;
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
			authorization: `Bearer ${credentials.apiToken}`,
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
			: parseYaml(await ky(sourceUrl).text());
	let rawReleaseNotes = parseString(getPath(response, config.path));
	let releaseNotesUrl: string | undefined;

	if (isHttpUrl(rawReleaseNotes)) {
		releaseNotesUrl = rawReleaseNotes;
		rawReleaseNotes = parseString(await ky(rawReleaseNotes).text());
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
				releaseNotes:
					(await komac.getGithubReleaseNotes({ owner, repository: repo, tag })) ?? undefined,
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
	installerUrls: string[],
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

	const values = { version, ...templateValues };

	if (!('source' in releaseNotesConfig)) {
		return {
			releaseNotes: undefined,
			releaseNotesUrl: resolveValuePlaceholders(releaseNotesConfig.releaseNotesUrl, values),
		};
	}

	const urlsToValidate = new Set(installerUrls);
	if (urlsToValidate.size === 0) {
		throw new Error('No installer URLs were resolved');
	}

	await Promise.all(
		urlsToValidate.values().map(async (url) => {
			const response = await ky.head(url, { throwHttpErrors: false });
			if (!response.ok) {
				throw new Error(`Installer URL returned HTTP ${response.status}: ${url}`);
			}
		}),
	);

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
