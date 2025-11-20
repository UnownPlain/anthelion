import { writeFileSync } from '@std/fs/unstable-write-file';
import { z } from 'zod';

export enum Strategy {
	GithubRelease = 'github-release',
	PageMatch = 'page-match',
	RedirectMatch = 'redirect-match',
	ElectronBuilder = 'electron-builder',
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

const electronBuilderSchema = z.object({
	url: z.url().describe('Direct YAML URL (latest.yml, beta.yml, etc.).'),
});

const jsonStrategySchema = z.object({
	url: z.url().describe('Endpoint returning JSON.'),
	path: z
		.string()
		.describe(
			'Dot-separated path to string value (arrays use numeric indexes).',
		),
});

const versionRemoveSchema = z
	.string()
	.describe("Substring(s) to strip after auto-leading 'v' removal.")
	.optional();

const baseTaskFields = {
	$schema: z.url().describe('Optional JSON Schema reference URL.').optional(),
	packageId: z.string().describe('Task identifier in winget-pkgs.'),
	args: z.array(z.string()).optional(),
	releaseNotes: z
		.string()
		.describe('Optional release notes text. Can contain {version} placeholder.')
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
				message:
					'Cannot provide URL templates when fetching from the GitHub Releases API.',
				path: ['urls'],
			});
		} else if (!fetchUrlsFromApi && (!task.urls || task.urls.length === 0)) {
			ctx.addIssue({
				code: 'custom',
				message:
					'At least one URL template is required unless fetchUrlsFromApi is enabled.',
				path: ['urls'],
			});
		}
	});

const pageMatchVariant = z.object({
	...baseTaskFields,
	strategy: z.literal(Strategy.PageMatch),
	pageMatch: pageMatchSchema,
	urls: z
		.array(z.string())
		.min(1)
		.describe('Template or literal URLs with {version} placeholder.'),
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

const electronBuilderVariant = z.object({
	...baseTaskFields,
	strategy: z.literal(Strategy.ElectronBuilder),
	electronBuilder: electronBuilderSchema,
	urls: z
		.array(z.string())
		.min(1)
		.describe('Template or literal URLs with {version} placeholder.'),
});

const jsonVariant = z.object({
	...baseTaskFields,
	strategy: z.literal(Strategy.Json),
	json: jsonStrategySchema,
	urls: z
		.array(z.string())
		.min(1)
		.describe('Template or literal URLs with {version} placeholder.'),
});

export const JsonTaskSchema = z.discriminatedUnion('strategy', [
	githubReleaseVariant,
	pageMatchVariant,
	redirectMatchVariant,
	electronBuilderVariant,
	jsonVariant,
]);

export type JsonTask = z.infer<typeof JsonTaskSchema>;

export const ScriptTaskResult = z.object({
	version: z.string(),
	urls: z.array(z.string()),
	args: z.array(z.string()).optional(),
});

export async function generateJsonTaskSchema() {
	const encoder = new TextEncoder();
	writeFileSync(
		'./src/schema/task/schema.json',
		encoder.encode(JSON.stringify(z.toJSONSchema(JsonTaskSchema), null, 2)),
	);
	console.log(
		'Successfully generated JSON schema: src/schema/task/schema.json',
	);
}

if (import.meta.main) {
	await generateJsonTaskSchema();
}
