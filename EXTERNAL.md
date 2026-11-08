# Using Anthelion from another repository

Anthelion can be installed as a pinned Git dependency. Keep the consuming repository's shards in
`shards/json` and `shards/script`; Anthelion resolves those paths from the current working directory.

```json
{
	"private": true,
	"type": "module",
	"scripts": {
		"update": "anthelion",
		"test:shard": "anthelion-test"
	},
	"dependencies": {
		"anthelion": "github:UnownPlain/anthelion-external#{COMMIT}"
	}
}
```

Install dependencies and test one or more shards:

```sh
bun install
bun test:shard {PACKAGE_IDENTIFIER} # Simulates a real run
bun test:shard {PACKAGE_IDENTIFIER_ONE} {PACKAGE_IDENTIFIER_TWO} --dry-run # Generates manifests without opening PRs
```

## Runtime configuration

Anthelion loads `anthelion.config.ts` from the current working directory. Runtime settings are:

| Setting                   | Purpose                                                  | Default                                                                                                    |
| ------------------------- | -------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| `shardsDirectory`         | Directory containing `json` and `script` shards          | `shards`; config only                                                                                      |
| `concurrency`             | Maximum concurrent shard runs                            | `256`; config only                                                                                         |
| `dryRunConcurrency`       | Shard concurrency cap for full dry runs                  | `16`; config only                                                                                          |
| `downloadConcurrency`     | Maximum concurrent installer downloads/analysis in Komac | Available CPUs; config only                                                                                |
| `dryRun`                  | Generate manifests without submissions or state changes  | `DRY_RUN=true` or `DRY_RUN=1`, otherwise `false`                                                           |
| `stepSummary`             | Optional GitHub Actions Markdown summary path            | `GITHUB_STEP_SUMMARY`                                                                                      |
| `github.token`            | Token passed to Octokit and Komac                        | `GITHUB_TOKEN`                                                                                             |
| `github.forkOwner`        | Fork owner used for submissions                          | `KOMAC_FORK_OWNER`, then `GITHUB_REPOSITORY_OWNER`, then Komac's default                                   |
| `github.repository`       | `{ owner, repo, branch }` for version-state commits      | `GITHUB_REPOSITORY` and `GITHUB_REF_NAME` (branch defaults to `main`)                                      |
| `github.targetRepository` | `{ owner, repo, branch }` for package manifests          | `KOMAC_GITHUB_OWNER`, `KOMAC_GITHUB_REPO`, `KOMAC_GITHUB_REF`, otherwise `microsoft/winget-pkgs`, `master` |
| `browserRendering`        | `{ accountId, apiToken }` for Cloudflare rendering       | `CLOUDFLARE_ACCOUNT_ID` and `CLOUDFLARE_API_TOKEN`; disabled without an account ID                         |
| `releaseNotes`            | AI SDK model and cleanup concurrency                     | Disabled; concurrency defaults to 1 and is config only                                                     |

Example settings for a consuming repository:

```ts
import type { AnthelionConfig } from 'anthelion/config';

export default {
	shardsDirectory: 'shards',
	concurrency: 32,
	dryRunConcurrency: 16,
	github: {
		forkOwner: 'example',
		repository: { owner: 'example', repo: 'my-shards', branch: 'main' },
		targetRepository: { owner: 'microsoft', repo: 'winget-pkgs', branch: 'master' },
	},
} satisfies AnthelionConfig;
```

Explicit config values override the environment defaults, including `dryRun: false` and an empty
`stepSummary`. Settings omitted from a `github` object still receive their environment defaults.
The Cloudflare token defaults to `CLOUDFLARE_API_TOKEN` even when its account ID is configured
explicitly. `ANTHELION_SHARDS_DIR` and concurrency environment variables are ignored.
The `--dry-run` CLI flag overrides `dryRun` in the loaded config. Testing `all` in dry-run mode
caps shard concurrency at `dryRunConcurrency` (default 16), preserving lower `concurrency` values. Komac's environment-only
repository/fork interface is populated internally from the resolved config.

## Provider configuration

Anthelion loads `anthelion.config.ts` from the current working directory. Supply any AI SDK
language model using your provider's package and authentication. For example, a consuming
repository can install `@ai-sdk/groq` and configure:

```ts
import { groq } from '@ai-sdk/groq';
import type { AnthelionConfig } from 'anthelion/config';

export default {
	releaseNotes: {
		model: groq('openai/gpt-oss-120b'),
		concurrency: 4,
	},
} satisfies AnthelionConfig;
```

`releaseNotes.concurrency` must be a positive integer and defaults to 1. Provider configuration
is loaded once per process. Without a config file or `releaseNotes.model`, cleanup is skipped
and cleaned release notes are omitted. Anthelion does not select a provider from API-key
environment variables; provider-specific settings belong in the consuming repository's config.

For stateful providers, `releaseNotes.model` can be a function returning a new model for each
cleanup. Follow-up requests reuse that model and append messages to the same conversation history,
so concurrent packages keep separate conversations.

## Writing shards

JSON shards use the published schema URL for completion and validation. TypeScript shards can import
the public helpers and use `defineShard` for return-value IntelliSense:

```ts
import { defineShard } from 'anthelion';
import { getLatestReleaseFromRedirect } from 'anthelion/github';
import { match } from 'anthelion/helpers';

export default defineShard(async () => {
	const release = await getLatestReleaseFromRedirect({
		owner: 'git-for-windows',
		repo: 'git',
	});
	const {
		groups: [baseVersion, buildNumber],
	} = match(release.tag, /^(\d+(?:\.\d+)+)\.windows\.(\d+)$/);
	const version = buildNumber === '1' ? baseVersion : `${baseVersion}.${buildNumber}`;

	return {
		version,
		urls: () => [
			`https://github.com/git-for-windows/git/releases/download/${release.rawTag}/MinGit-${version}-32-bit.zip`,
			`https://github.com/git-for-windows/git/releases/download/${release.rawTag}/MinGit-${version}-64-bit.zip`,
			`https://github.com/git-for-windows/git/releases/download/${release.rawTag}/MinGit-${version}-arm64.zip`,
		],
	};
});
```

See the [Shard Guide](CONTRIBUTING.md) for strategies, release notes, and testing guidance.
