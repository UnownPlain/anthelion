import { z } from 'zod';

import { resolveVersionPlaceholders } from '@/helpers';

export enum ReleaseNotesSource {
	Html = 'html',
	Github = 'github',
	Json = 'json',
	Yaml = 'yaml',
	BrowserRendering = 'browser-rendering',
}

const releaseNotesHtmlSchema = z.object({
	source: z.literal(ReleaseNotesSource.Html),
	sourceUrl: z
		.string()
		.describe(
			'Source URL to fetch and parse release notes from. Supports {version} placeholders in URL.',
		),
	releaseNotesUrl: z
		.string()
		.describe(
			'Optional URL to set in the manifest ReleaseNotesUrl field. Supports {version} placeholders in URL.',
		)
		.optional(),
	characterLimit: z
		.int()
		.positive()
		.describe('Optional max character limit for parsed HTML release notes.')
		.optional(),
	cleanup: z
		.boolean()
		.default(true)
		.describe('Cleanup release notes with AI. Enabled by default for HTML sources.')
		.optional(),
});

const releaseNotesBrowserRenderingSchema = z.object({
	source: z.literal(ReleaseNotesSource.BrowserRendering),
	sourceUrl: z
		.string()
		.describe(
			'Source URL to fetch and parse release notes from using Cloudflare Browser Rendering. Supports {version} placeholders in URL.',
		),
	releaseNotesUrl: z
		.string()
		.describe(
			'Optional URL to set in the manifest ReleaseNotesUrl field. Supports {version} placeholders in URL.',
		)
		.optional(),
	characterLimit: z
		.int()
		.positive()
		.describe('Optional max character limit for parsed HTML release notes.')
		.optional(),
	waitUntil: z
		.enum(['load', 'domcontentloaded', 'networkidle0', 'networkidle2'])
		.describe('Optional browser wait condition for navigation.')
		.optional(),
	waitForSelector: z
		.string()
		.describe('Optional selector to wait for before capturing HTML.')
		.optional(),
});

const releaseNotesGithubSchema = z.object({
	source: z.literal(ReleaseNotesSource.Github),
	owner: z
		.string()
		.describe(
			'GitHub repository owner. Optional when strategy is github-release (defaults to github.owner).',
		)
		.optional(),
	repo: z
		.string()
		.describe(
			'GitHub repository name. Optional when strategy is github-release (defaults to github.repo).',
		)
		.optional(),
	tag: z
		.string()
		.describe(
			'Tag template for the release notes lookup. Supports {version}. Optional when strategy is github-release (uses resolved release tag).',
		)
		.optional(),
	cleanup: z
		.boolean()
		.default(false)
		.describe('Cleanup release notes with AI. Disabled by default for GitHub sources.')
		.optional(),
});

const releaseNotesJsonSchema = z.object({
	source: z.literal(ReleaseNotesSource.Json),
	sourceUrl: z
		.url()
		.describe('Endpoint returning JSON release notes content or URLs. Supports {version}.'),
	releaseNotesUrl: z
		.string()
		.describe(
			'Optional URL to set in the manifest ReleaseNotesUrl field. Supports {version} placeholders in URL.',
		)
		.optional(),
	path: z.string().describe('Dot-separated path to release notes content or URL.'),
	cleanup: z
		.boolean()
		.default(false)
		.describe('Cleanup release notes with AI. Disabled by default for JSON sources.')
		.optional(),
});

const releaseNotesYamlSchema = z.object({
	source: z.literal(ReleaseNotesSource.Yaml),
	sourceUrl: z
		.url()
		.describe('Endpoint returning YAML release notes content or URLs. Supports {version}.'),
	releaseNotesUrl: z
		.string()
		.describe(
			'Optional URL to set in the manifest ReleaseNotesUrl field. Supports {version} placeholders in URL.',
		)
		.optional(),
	path: z.string().describe('Dot-separated path to release notes content or URL.'),
	cleanup: z
		.boolean()
		.default(false)
		.describe('Cleanup release notes with AI. Disabled by default for YAML sources.')
		.optional(),
});

const releaseNotesUrlOnlySchema = z.object({
	releaseNotesUrl: z
		.string()
		.describe('URL to set in the manifest ReleaseNotesUrl field. Supports {version} placeholders.'),
});

const releaseNotesSourceSchema = z.discriminatedUnion('source', [
	releaseNotesHtmlSchema,
	releaseNotesBrowserRenderingSchema,
	releaseNotesGithubSchema,
	releaseNotesJsonSchema,
	releaseNotesYamlSchema,
]);

const releaseNotesUnionSchema = z.union([releaseNotesSourceSchema, releaseNotesUrlOnlySchema]);

export const releaseNotesSchema = releaseNotesUnionSchema.optional();

export function normalizedReleaseNotesSchema(version: string) {
	return z.union([
		releaseNotesUrlOnlySchema.transform((value) => ({
			kind: 'url-only' as const,
			releaseNotesUrl: resolveVersionPlaceholders(value.releaseNotesUrl, version),
		})),
		releaseNotesHtmlSchema.transform((value) => {
			const sourceUrl = resolveVersionPlaceholders(value.sourceUrl, version);
			const releaseNotesUrl = value.releaseNotesUrl
				? resolveVersionPlaceholders(value.releaseNotesUrl, version)
				: sourceUrl;

			return {
				kind: 'source' as const,
				...value,
				sourceUrl,
				releaseNotesUrl,
			};
		}),
		releaseNotesBrowserRenderingSchema.transform((value) => {
			const sourceUrl = resolveVersionPlaceholders(value.sourceUrl, version);
			const releaseNotesUrl = value.releaseNotesUrl
				? resolveVersionPlaceholders(value.releaseNotesUrl, version)
				: sourceUrl;

			return {
				kind: 'source' as const,
				...value,
				sourceUrl,
				releaseNotesUrl,
			};
		}),
		releaseNotesGithubSchema.transform((value) => ({
			kind: 'source' as const,
			...value,
			tag: value.tag ? resolveVersionPlaceholders(value.tag, version) : undefined,
			releaseNotesUrl: undefined,
		})),
		releaseNotesJsonSchema.transform((value) => {
			const sourceUrl = resolveVersionPlaceholders(value.sourceUrl, version);
			const releaseNotesUrl = value.releaseNotesUrl
				? resolveVersionPlaceholders(value.releaseNotesUrl, version)
				: sourceUrl;

			return {
				kind: 'source' as const,
				...value,
				sourceUrl,
				releaseNotesUrl,
			};
		}),
		releaseNotesYamlSchema.transform((value) => {
			const sourceUrl = resolveVersionPlaceholders(value.sourceUrl, version);
			const releaseNotesUrl = value.releaseNotesUrl
				? resolveVersionPlaceholders(value.releaseNotesUrl, version)
				: sourceUrl;

			return {
				kind: 'source' as const,
				...value,
				sourceUrl,
				releaseNotesUrl,
			};
		}),
	]);
}
