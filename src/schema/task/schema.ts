import { z } from 'zod';

const githubSchema = z.object({
	owner: z.string(),
	repo: z.string(),
});

const pageMatchSchema = z.object({
	url: z.url(),
	regex: z.string(),
});

const redirectMatchSchema = z.object({
	url: z.url(),
	regex: z.string(),
	method: z.enum(['head', 'get']).default('head').optional(),
	useRedirectUrl: z.boolean().default(true).optional(),
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
	regex: z
		.string()
		.describe('Optional capturing pattern to isolate version.')
		.optional(),
});

const versionRemoveSchema = z
	.union([z.string(), z.array(z.string().min(1)).min(1)])
	.describe("Substring(s) to strip after auto-leading 'v' removal.")
	.optional();

export const TaskSchema = z
	.object({
		packageId: z.string().describe('Task identifier in winget-pkgs.'),
		strategy: z
			.enum([
				'github-release',
				'page-match',
				'redirect-match',
				'electron-builder',
				'json',
			])
			.describe('Version resolution strategy.'),
		github: githubSchema.optional(),
		pageMatch: pageMatchSchema.optional(),
		redirectMatch: redirectMatchSchema.optional(),
		electronBuilder: electronBuilderSchema.optional(),
		json: jsonStrategySchema.optional(),
		versionRemove: versionRemoveSchema,
		urls: z
			.array(z.string())
			.min(1)
			.describe('Template or literal URLs with {version} placeholder.'),
		args: z.array(z.string()).optional(),
		releaseNotes: z
			.string()
			.describe(
				'Optional release notes text. Can contain {version} placeholder.',
			)
			.optional(),
		replace: z
			.boolean()
			.default(false)
			.describe('Replace latest version with new version.')
			.optional(),
	})
	.superRefine((data, ctx) => {
		const need = (cond: boolean, field: string, msg: string) => {
			if (cond) {
				ctx.addIssue({
					code: 'custom',
					path: [field],
					message: msg,
				});
			}
		};
		switch (data.strategy) {
			case 'github-release':
				need(
					!data.github,
					'github',
					'github is required when strategy=github-release',
				);
				break;
			case 'page-match':
				need(
					!data.pageMatch,
					'pageMatch',
					'pageMatch is required when strategy=page-match',
				);
				break;
			case 'redirect-match':
				need(
					!data.redirectMatch,
					'redirectMatch',
					'redirectMatch is required when strategy=redirect-match',
				);
				break;
			case 'electron-builder':
				need(
					!data.electronBuilder,
					'electronBuilder',
					'electronBuilder is required when strategy=electron-builder',
				);
				break;
			case 'json':
				need(!data.json, 'json', 'json is required when strategy=json');
				break;
		}
	});

export type Task = z.infer<typeof TaskSchema>;

async function main() {
	await Bun.write(
		'./src/schema/task/schema.json',
		JSON.stringify(z.toJSONSchema(TaskSchema), null, 2),
	).catch((e) => {
		console.log('Failed to write file:', e.message);
	});
	console.log('Successfuly generated JSON schema: src/schema/task/schema.json');
}

void main();
