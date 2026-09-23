import { z } from 'zod';

import {
	releaseNotesSchema,
	releaseNotesWithRequiredGithubRepositorySchema,
	ReleaseNotesSource,
} from '@/schema/release-notes';

export enum Strategy {
	GithubRelease = 'github-release',
	GithubCommit = 'github-commit',
	PageMatch = 'page-match',
	SortVersions = 'sort-versions',
	RedirectMatch = 'redirect-match',
	SourceForge = 'sourceforge',
	AppInstaller = 'appinstaller',
	ElectronBuilder = 'electron-builder',
	Tauri = 'tauri',
	ToDesktop = 'todesktop',
	MsDownloadCenter = 'ms-download-center',
	Xml = 'xml',
	Yaml = 'yaml',
	Json = 'json',
	Static = 'static',
}

const githubRepositoryFields = {
	owner: z.string(),
	repo: z.string(),
};

const githubSchema = z.discriminatedUnion('method', [
	z.strictObject({
		...githubRepositoryFields,
		method: z
			.literal('redirect')
			.default('redirect')
			.optional()
			.describe('Use getLatestReleaseFromRedirect: HEAD /releases/latest, without the GitHub API.'),
	}),
	z.strictObject({
		...githubRepositoryFields,
		method: z
			.literal('api-latest')
			.describe('Use getLatestRelease with useLatestEndpoint: true: GitHub REST latest release.'),
		assetRegex: z
			.string()
			.min(1)
			.optional()
			.describe('Case-insensitive regex matched against release asset filenames.'),
	}),
	z.strictObject({
		...githubRepositoryFields,
		method: z
			.literal('api-list')
			.describe('Use getLatestRelease: GitHub REST release list, filtered in response order.'),
		kind: z
			.enum(['stable', 'prerelease', 'all'])
			.default('stable')
			.optional()
			.describe('Which releases to consider.'),
		tagRegex: z
			.string()
			.min(1)
			.optional()
			.describe('Select tags matching this regex and remove the match from the detected version.'),
		perPage: z
			.number()
			.int()
			.min(1)
			.max(100)
			.default(25)
			.optional()
			.describe('Number of releases to inspect in one GitHub REST API page.'),
		assetRegex: z
			.string()
			.min(1)
			.optional()
			.describe('Case-insensitive regex matched against release asset filenames.'),
	}),
]);

const githubCommitSchema = z.object({
	owner: z.string(),
	repo: z.string(),
	branch: z.string().min(1).default('HEAD').optional(),
	path: z.string().min(1).describe('Repository-relative path to the tracked file.'),
});

const pageMatchSchema = z.object({
	url: z.url(),
	regex: z
		.string()
		.describe(
			'Regex whose first capture or named "version" capture contains the version. Use {version} in templates; other named captures are available as {captures.name}.',
		),
});

const sortVersionsSchema = z.object({
	url: z.url(),
	regex: z.string(),
});

const redirectMatchSchema = z.object({
	url: z.array(z.url()).min(1),
	regex: z
		.string()
		.describe(
			'Regex whose first capture or named "version" capture contains the version. Use {version} in templates; other named captures from the first redirect are available as {captures.name}.',
		),
	method: z.enum(['head', 'get']).default('get').optional(),
});

const sourceforgeSchema = z.object({
	project: z.string().describe('SourceForge project slug (e.g. winscp).'),
	file: z.string().describe('File name pattern with {version} placeholder.').optional(),
});

const appInstallerSchema = z.object({
	url: z
		.union([z.url(), z.array(z.url()).min(1)])
		.describe(
			'One or more App Installer XML feed URLs. All feeds must report the same package version.',
		),
});

const electronBuilderSchema = z.object({
	url: z.url().describe('Direct YAML URL (latest.yml, beta.yml, etc.).'),
});

const tauriSchema = z.object({
	url: z.url().describe('Direct URL to a static Tauri updater JSON file.'),
	platforms: z
		.array(z.string().min(1))
		.min(1)
		.describe('Platform keys to use. Defaults to every key beginning with windows-.')
		.optional(),
});

const toDesktopSchema = z.object({
	appId: z.string().min(1).describe('ToDesktop application ID.'),
});

const msDownloadCenterSchema = z.object({
	id: z.number().int().positive().describe('Microsoft Download Center details ID.'),
	regex: z
		.string()
		.describe('Optional case-insensitive regex used to filter download file names.')
		.optional(),
});

const jsonStrategySchema = z
	.object({
		url: z.url().describe('Endpoint returning JSON.'),
		path: z.string().describe('Dot-separated path to string value (arrays use numeric indexes).'),
		method: z.enum(['get', 'post']).default('get').optional(),
		body: z.json().describe('JSON request body. Requires method: post.').optional(),
	})
	.refine((options) => options.body === undefined || options.method === 'post', {
		message: 'A JSON request body requires method: post.',
		path: ['body'],
	});

const yamlStrategySchema = z.object({
	url: z.url().describe('Endpoint returning YAML.'),
	path: z.string().describe('Dot-separated path to string value (arrays use numeric indexes).'),
});

const xmlStrategySchema = z.object({
	url: z.url().describe('Endpoint returning XML.'),
	path: z
		.string()
		.min(1)
		.describe(
			'Dot-separated path including the root element. All elements use numeric indexes (including the root); attributes use _attributes; text on elements with attributes uses value.',
		),
});

const stateSchema = z.discriminatedUnion('source', [
	z.object({
		source: z.literal('response-header'),
		url: z.string().describe('URL whose response header is used as the persisted state.'),
		header: z.string().min(1).describe('Response header containing the persisted state.'),
		method: z.enum(['head', 'get']).default('head').optional(),
	}),
	z.object({
		source: z.literal('value'),
		value: z.string().min(1).describe('Persisted state value. Supports resolved placeholders.'),
	}),
]);

const urlsSchema = z
	.array(
		z.union([
			z.string(),
			z.object({
				url: z.string(),
				architecture: z.enum(['x86', 'x64', 'arm', 'arm64', 'neutral']).optional(),
				nestedInstallerMatches: z.array(z.string().min(1)).min(1).optional(),
			}),
		]),
	)
	.min(1)
	.describe(
		'Template or literal URLs. Supports {version}, named values such as {captures.name}, and {value|from|to} replacement.',
	);

const versionSchema = z.union([
	z.string().min(1),
	z.object({
		source: z.enum(['display', 'product', 'file', 'fontVersion']),
	}),
]);

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
	version: versionSchema
		.describe(
			'Optional override for the resolved package version. Supports resolved placeholders such as {version}.',
		)
		.optional(),
	ignoreOtherPrs: z
		.boolean()
		.describe('Ignore pull requests created by other users when checking for an existing update.')
		.default(false)
		.optional(),
	state: stateSchema.describe('Optional state used to skip unchanged updates.').optional(),
};

const baseShardFieldsWithoutGithub = {
	...baseShardFields,
	releaseNotes: releaseNotesWithRequiredGithubRepositorySchema,
};

const githubReleaseVariant = z
	.object({
		...baseShardFields,
		strategy: z.literal(Strategy.GithubRelease),
		github: githubSchema,
		urls: urlsSchema.optional(),
	})
	.superRefine((shard, ctx) => {
		if ((shard.github.method ?? 'redirect') === 'redirect' && !shard.urls?.length) {
			ctx.addIssue({
				code: 'custom',
				message: 'At least one URL template is required for the GitHub redirect method.',
				path: ['urls'],
			});
		}
		if (
			shard.github.method !== 'redirect' &&
			'assetRegex' in shard.github &&
			shard.github.assetRegex &&
			shard.urls?.length
		) {
			ctx.addIssue({
				code: 'custom',
				message: 'Cannot provide URL templates when github.assetRegex is enabled.',
				path: ['urls'],
			});
		}
	});

const githubCommitVariant = z.object({
	...baseShardFields,
	strategy: z.literal(Strategy.GithubCommit),
	github: githubCommitSchema,
	urls: urlsSchema,
});

const pageMatchVariant = z.object({
	...baseShardFieldsWithoutGithub,
	strategy: z.literal(Strategy.PageMatch),
	pageMatch: pageMatchSchema,
	urls: urlsSchema,
});

const sortVersionsVariant = z.object({
	...baseShardFieldsWithoutGithub,
	strategy: z.literal(Strategy.SortVersions),
	sortVersions: sortVersionsSchema,
	urls: urlsSchema,
});

const redirectMatchVariant = z.object({
	...baseShardFieldsWithoutGithub,
	strategy: z.literal(Strategy.RedirectMatch),
	redirectMatch: redirectMatchSchema,
	urls: urlsSchema.optional(),
});

const sourceforgeVariant = z.object({
	...baseShardFieldsWithoutGithub,
	strategy: z.literal(Strategy.SourceForge),
	sourceforge: sourceforgeSchema,
	urls: urlsSchema,
});

const appInstallerVariant = z.object({
	...baseShardFieldsWithoutGithub,
	strategy: z.literal(Strategy.AppInstaller),
	appinstaller: appInstallerSchema,
	urls: urlsSchema.optional(),
});

const electronBuilderVariant = z.object({
	...baseShardFieldsWithoutGithub,
	strategy: z.literal(Strategy.ElectronBuilder),
	electronBuilder: electronBuilderSchema,
	urls: urlsSchema.optional(),
});

const tauriVariant = z.object({
	...baseShardFieldsWithoutGithub,
	strategy: z.literal(Strategy.Tauri),
	tauri: tauriSchema,
	urls: urlsSchema.optional(),
});

const toDesktopVariant = z.object({
	...baseShardFieldsWithoutGithub,
	strategy: z.literal(Strategy.ToDesktop),
	todesktop: toDesktopSchema,
	urls: urlsSchema.optional(),
});

const msDownloadCenterVariant = z.object({
	...baseShardFieldsWithoutGithub,
	strategy: z.literal(Strategy.MsDownloadCenter),
	msDownloadCenter: msDownloadCenterSchema,
	urls: urlsSchema.optional(),
});

const jsonVariant = z.object({
	...baseShardFieldsWithoutGithub,
	strategy: z.literal(Strategy.Json),
	json: jsonStrategySchema,
	urls: urlsSchema,
});

const yamlVariant = z.object({
	...baseShardFieldsWithoutGithub,
	strategy: z.literal(Strategy.Yaml),
	yaml: yamlStrategySchema,
	urls: urlsSchema,
});

const xmlVariant = z.object({
	...baseShardFieldsWithoutGithub,
	strategy: z.literal(Strategy.Xml),
	xml: xmlStrategySchema,
	urls: urlsSchema,
});

const staticVariant = z.object({
	...baseShardFieldsWithoutGithub,
	strategy: z.literal(Strategy.Static),
	version: versionSchema,
	urls: urlsSchema,
});

export const JsonShardSchema = z
	.discriminatedUnion('strategy', [
		githubReleaseVariant,
		githubCommitVariant,
		pageMatchVariant,
		sortVersionsVariant,
		redirectMatchVariant,
		sourceforgeVariant,
		appInstallerVariant,
		electronBuilderVariant,
		tauriVariant,
		toDesktopVariant,
		msDownloadCenterVariant,
		jsonVariant,
		yamlVariant,
		xmlVariant,
		staticVariant,
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
