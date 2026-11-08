import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

import { Komac } from '@unownplain/anthelion-komac';
import type { LanguageModel } from 'ai';
import { Octokit } from 'octokit';
import { z } from 'zod';

const concurrencySchema = z.int().positive();
const repositorySchema = z.object({ owner: z.string(), repo: z.string(), branch: z.string() });
const configSchema = z.object({
	shardsDirectory: z.string().default('shards'),
	concurrency: concurrencySchema.default(256),
	dryRunConcurrency: concurrencySchema.default(16),
	downloadConcurrency: concurrencySchema.optional(),
	dryRun: z.boolean().optional(),
	stepSummary: z.string().optional(),
	github: z
		.object({
			token: z.string().optional(),
			forkOwner: z.string().optional(),
			repository: repositorySchema.optional(),
			targetRepository: repositorySchema.optional(),
		})
		.optional(),
	browserRendering: z
		.object({
			accountId: z.string(),
			apiToken: z.string().optional(),
		})
		.optional(),
	releaseNotes: z
		.object({
			model: z.custom<LanguageModel | (() => LanguageModel)>(),
			concurrency: concurrencySchema.default(1),
		})
		.optional(),
});

export type AnthelionConfig = z.input<typeof configSchema>;
const configPath = resolve('anthelion.config.ts');
const userConfig = configSchema.parse(
	existsSync(configPath) ? (await import(pathToFileURL(configPath).href)).default : {},
);
const [owner, repo] = process.env.GITHUB_REPOSITORY?.split('/') ?? [];
const repository =
	owner && repo ? { owner, repo, branch: process.env.GITHUB_REF_NAME || 'main' } : undefined;
const accountId = userConfig.browserRendering?.accountId ?? process.env.CLOUDFLARE_ACCOUNT_ID;

export const config = {
	...userConfig,
	dryRun: userConfig.dryRun ?? ['true', '1'].includes(process.env.DRY_RUN || ''),
	stepSummary: userConfig.stepSummary ?? process.env.GITHUB_STEP_SUMMARY,
	github: {
		token: userConfig.github?.token ?? process.env.GITHUB_TOKEN,
		forkOwner:
			userConfig.github?.forkOwner ??
			(process.env.KOMAC_FORK_OWNER || process.env.GITHUB_REPOSITORY_OWNER),
		repository: userConfig.github?.repository ?? repository,
		targetRepository: userConfig.github?.targetRepository ?? {
			owner: process.env.KOMAC_GITHUB_OWNER || 'microsoft',
			repo: process.env.KOMAC_GITHUB_REPO || 'winget-pkgs',
			branch: process.env.KOMAC_GITHUB_REF || 'master',
		},
	},
	browserRendering: accountId
		? {
				accountId,
				apiToken: userConfig.browserRendering?.apiToken ?? process.env.CLOUDFLARE_API_TOKEN,
			}
		: undefined,
};

export type ResolvedAnthelionConfig = typeof config;

const target = config.github.targetRepository;

// Komac exposes repository and fork settings through environment variables only.
process.env.KOMAC_GITHUB_OWNER = target.owner;
process.env.KOMAC_GITHUB_REPO = target.repo;
process.env.KOMAC_GITHUB_REF = target.branch;
if (config.github.forkOwner) {
	process.env.KOMAC_FORK_OWNER = config.github.forkOwner;
} else {
	delete process.env.KOMAC_FORK_OWNER;
}

export const githubClient = new Octokit({ auth: config.github.token });
export const komac = new Komac({
	githubToken: config.github.token,
	downloadConcurrency: config.downloadConcurrency,
});
