import fs from '@rcompat/fs';
import { z } from 'zod';

export enum Strategy {
	GithubRelease = 'github-release',
	PageMatch = 'page-match',
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

const versionRemoveSchema = z
	.string()
	.describe("Substring(s) to strip after auto-leading 'v' removal.")
	.optional();

const baseTaskFields = {
	$schema: z.url().describe('Optional JSON Schema reference URL.').optional(),
	packageId: z.string().describe('Task identifier in winget-pkgs.'),
	releaseNotesUrl: z
		.string()
		.describe('Optional release notes URL. Can contain {version} placeholder or JSON path.')
		.optional(),
	replace: z
		.boolean()
		.default(false)
		.describe('Replace latest version with new version.')
		.optional(),
	versionRemove: versionRemoveSchema,
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

export const JsonTaskSchema = z.discriminatedUnion('strategy', [
	githubReleaseVariant,
	pageMatchVariant,
	redirectMatchVariant,
	sourceforgeVariant,
	electronBuilderVariant,
	jsonVariant,
	yamlVariant,
]);

export type JsonTask = z.infer<typeof JsonTaskSchema>;

export const ScriptTaskResult = z.object({
	version: z.string(),
	urls: z.array(z.string()),
	releaseNotesUrl: z.string().optional(),
	replace: z.boolean().optional(),
	skipPrCheck: z.boolean().default(false),
	state: z.string().optional(),
});

export async function generateJsonTaskSchema() {
	const schemaFile = new fs.FileRef('./src/schema/task/schema.json');
	await schemaFile.write(JSON.stringify(z.toJSONSchema(JsonTaskSchema), null, 2));
	console.log('Successfully generated JSON schema: src/schema/task/schema.json');
}

if (import.meta.main) {
	await generateJsonTaskSchema();
}
