import { z } from 'zod';

import { releaseNotesSchema, ReleaseNotesSource } from '@/schema/release-notes';

export enum Strategy {
	GithubRelease = 'github-release',
	PageMatch = 'page-match',
	SortVersions = 'sort-versions',
	RedirectMatch = 'redirect-match',
	SourceForge = 'sourceforge',
	ElectronBuilder = 'electron-builder',
	Yaml = 'yaml',
	Json = 'json',
}

const githubSchema = z.object({
	owner: z.string(),
	repo: z.string(),
	preRelease: z.boolean().default(false).optional(),
	fetchUrlsFromApi: z
		.boolean()
		.describe(
			'Fetch asset download URLs via the GitHub Releases API instead of relying on templates.',
		)
		.default(false)
		.optional(),
	tagFilter: z.string().optional(),
	fetchLatest: z.boolean().default(false).optional(),
});

const pageMatchSchema = z.object({
	url: z.url(),
	regex: z.string(),
});

const sortVersionsSchema = z.object({
	url: z.url(),
	regex: z.string(),
});

const redirectMatchSchema = z.object({
	url: z.url(),
	regex: z.string(),
	method: z.enum(['head', 'get']).default('head').optional(),
});

const sourceforgeSchema = z.object({
	project: z.string().describe('SourceForge project slug (e.g. winscp).'),
	file: z.string().describe('File name pattern with {version} placeholder.').optional(),
});

const electronBuilderSchema = z.object({
	url: z.url().describe('Direct YAML URL (latest.yml, beta.yml, etc.).'),
});

const jsonStrategySchema = z.object({
	url: z.url().describe('Endpoint returning JSON.'),
	path: z.string().describe('Dot-separated path to string value (arrays use numeric indexes).'),
});

const yamlStrategySchema = z.object({
	url: z.url().describe('Endpoint returning YAML.'),
	path: z.string().describe('Dot-separated path to string value (arrays use numeric indexes).'),
});

const baseTaskFields = {
	$schema: z.url().describe('Optional JSON Schema reference URL.').optional(),
	releaseNotes: releaseNotesSchema,
	replace: z
		.boolean()
		.default(false)
		.describe('Replace latest version with new version.')
		.optional(),
	versionRemove: z
		.string()
		.describe("Substring(s) to strip after auto-leading 'v' removal.")
		.optional(),
};

const githubReleaseVariant = z
	.object({
		...baseTaskFields,
		strategy: z.literal(Strategy.GithubRelease),
		github: githubSchema,
		urls: z
			.array(z.string())
			.min(1)
			.describe('Template or literal URLs with {version} placeholder.')
			.optional(),
	})
	.superRefine((task, ctx) => {
		const fetchUrlsFromApi = task.github.fetchUrlsFromApi;
		if (fetchUrlsFromApi && task.urls && task.urls.length > 0) {
			ctx.addIssue({
				code: 'custom',
				message: 'Cannot provide URL templates when fetching from the GitHub Releases API.',
				path: ['urls'],
			});
		} else if (!fetchUrlsFromApi && (!task.urls || task.urls.length === 0)) {
			ctx.addIssue({
				code: 'custom',
				message: 'At least one URL template is required unless fetchUrlsFromApi is enabled.',
				path: ['urls'],
			});
		}
	});

const pageMatchVariant = z.object({
	...baseTaskFields,
	strategy: z.literal(Strategy.PageMatch),
	pageMatch: pageMatchSchema,
	urls: z.array(z.string()).min(1).describe('Template or literal URLs with {version} placeholder.'),
});

const sortVersionsVariant = z.object({
	...baseTaskFields,
	strategy: z.literal(Strategy.SortVersions),
	sortVersions: sortVersionsSchema,
	urls: z.array(z.string()).min(1).describe('Template or literal URLs with {version} placeholder.'),
});

const redirectMatchVariant = z.object({
	...baseTaskFields,
	strategy: z.literal(Strategy.RedirectMatch),
	redirectMatch: redirectMatchSchema,
	urls: z
		.array(z.string())
		.min(1)
		.describe('Template or literal URLs with {version} placeholder.')
		.optional(),
});

const sourceforgeVariant = z.object({
	...baseTaskFields,
	strategy: z.literal(Strategy.SourceForge),
	sourceforge: sourceforgeSchema,
	urls: z.array(z.string()).min(1).describe('Template or literal URLs with {version} placeholder.'),
});

const electronBuilderVariant = z.object({
	...baseTaskFields,
	strategy: z.literal(Strategy.ElectronBuilder),
	electronBuilder: electronBuilderSchema,
	urls: z.array(z.string()).min(1).describe('Template or literal URLs with {version} placeholder.'),
});

const jsonVariant = z.object({
	...baseTaskFields,
	strategy: z.literal(Strategy.Json),
	json: jsonStrategySchema,
	urls: z.array(z.string()).min(1).describe('Template or literal URLs with {version} placeholder.'),
});

const yamlVariant = z.object({
	...baseTaskFields,
	strategy: z.literal(Strategy.Yaml),
	yaml: yamlStrategySchema,
	urls: z.array(z.string()).min(1).describe('Template or literal URLs with {version} placeholder.'),
});

export const JsonTaskSchema = z
	.discriminatedUnion('strategy', [
		githubReleaseVariant,
		pageMatchVariant,
		sortVersionsVariant,
		redirectMatchVariant,
		sourceforgeVariant,
		electronBuilderVariant,
		jsonVariant,
		yamlVariant,
	])
	.superRefine((task, ctx) => {
		if (!task.releaseNotes || !('source' in task.releaseNotes)) {
			return;
		}

		if (task.releaseNotes.source !== ReleaseNotesSource.Github) {
			return;
		}

		if (task.strategy !== Strategy.GithubRelease && !task.releaseNotes.tag) {
			ctx.addIssue({
				code: 'custom',
				message: 'releaseNotes.tag is required unless strategy is github-release.',
				path: ['releaseNotes', 'tag'],
			});
		}
	});

export type JsonTask = z.infer<typeof JsonTaskSchema>;
