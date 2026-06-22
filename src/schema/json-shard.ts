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
	State = 'state',
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
	perPage: z
		.number()
		.int()
		.positive()
		.describe('Number of releases to fetch from the GitHub Releases API.')
		.default(25)
		.optional(),
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

const stateStrategySchema = z.object({
	url: z.url().describe('URL whose response header is used as the persisted state.'),
	header: z.string().min(1).describe('Response header containing the persisted state.'),
});

const urlsSchema = z
	.array(z.string())
	.min(1)
	.describe('Template or literal URLs with {version} placeholder.');

const baseShardFields = {
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
	installerMatches: z
		.array(z.string().min(1))
		.min(1)
		.describe('Executable names used to match installers inside an archive.')
		.optional(),
};

const githubReleaseVariant = z
	.object({
		...baseShardFields,
		strategy: z.literal(Strategy.GithubRelease),
		github: githubSchema,
		urls: urlsSchema.optional(),
	})
	.superRefine((shard, ctx) => {
		const fetchUrlsFromApi = shard.github.fetchUrlsFromApi;
		if (fetchUrlsFromApi && shard.urls && shard.urls.length > 0) {
			ctx.addIssue({
				code: 'custom',
				message: 'Cannot provide URL templates when fetching from the GitHub Releases API.',
				path: ['urls'],
			});
		} else if (!fetchUrlsFromApi && (!shard.urls || shard.urls.length === 0)) {
			ctx.addIssue({
				code: 'custom',
				message: 'At least one URL template is required unless fetchUrlsFromApi is enabled.',
				path: ['urls'],
			});
		}
	});

const pageMatchVariant = z.object({
	...baseShardFields,
	strategy: z.literal(Strategy.PageMatch),
	pageMatch: pageMatchSchema,
	urls: urlsSchema,
});

const sortVersionsVariant = z.object({
	...baseShardFields,
	strategy: z.literal(Strategy.SortVersions),
	sortVersions: sortVersionsSchema,
	urls: urlsSchema,
});

const redirectMatchVariant = z.object({
	...baseShardFields,
	strategy: z.literal(Strategy.RedirectMatch),
	redirectMatch: redirectMatchSchema,
	urls: urlsSchema.optional(),
});

const sourceforgeVariant = z.object({
	...baseShardFields,
	strategy: z.literal(Strategy.SourceForge),
	sourceforge: sourceforgeSchema,
	urls: urlsSchema,
});

const electronBuilderVariant = z.object({
	...baseShardFields,
	strategy: z.literal(Strategy.ElectronBuilder),
	electronBuilder: electronBuilderSchema,
	urls: urlsSchema,
});

const jsonVariant = z.object({
	...baseShardFields,
	strategy: z.literal(Strategy.Json),
	json: jsonStrategySchema,
	urls: urlsSchema,
});

const yamlVariant = z.object({
	...baseShardFields,
	strategy: z.literal(Strategy.Yaml),
	yaml: yamlStrategySchema,
	urls: urlsSchema,
});

const stateVariant = z.object({
	...baseShardFields,
	strategy: z.literal(Strategy.State),
	state: stateStrategySchema,
	version: z.string().min(1),
	urls: urlsSchema,
});

export const JsonShardSchema = z
	.discriminatedUnion('strategy', [
		githubReleaseVariant,
		pageMatchVariant,
		sortVersionsVariant,
		redirectMatchVariant,
		sourceforgeVariant,
		electronBuilderVariant,
		jsonVariant,
		yamlVariant,
		stateVariant,
	])
	.superRefine((shard, ctx) => {
		if (!shard.releaseNotes || !('source' in shard.releaseNotes)) {
			return;
		}

		if (shard.releaseNotes.source !== ReleaseNotesSource.Github) {
			return;
		}

		if (shard.strategy !== Strategy.GithubRelease && !shard.releaseNotes.tag) {
			ctx.addIssue({
				code: 'custom',
				message: 'releaseNotes.tag is required unless strategy is github-release.',
				path: ['releaseNotes', 'tag'],
			});
		}
	});

export type JsonShard = z.infer<typeof JsonShardSchema>;
