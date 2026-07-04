# Agent Instructions

Agents must read [CONTRIBUTING.md](CONTRIBUTING.md) before adding or changing shards. It is the
source of truth for shard selection, version detection, installer URLs, regexes, testing, and
release notes.

Anthelion is a TypeScript project that uses Bun to update packages in the WinGet Community
Repository. Source code is in `src`, and package shards are in `shards/json` and `shards/script`.
Prefer a JSON shard whenever the update can be expressed declaratively.

## Commands

- Test one shard: `bun test:shard {SHARD_NAME} --dry-run`
- Fetch a package's latest WinGet manifest: `komac show {PACKAGE_IDENTIFIER}`
- Fetch it from WSL: `GITHUB_TOKEN=$(gh auth token) komac show {PACKAGE_IDENTIFIER}`
- Lint and type-check: `bun lint`
- Format: `bun fmt`
- Regenerate the JSON schema after changing `src/schema/json-shard.ts`: `bun gen:schema`

## Misc

Run `bun start` only when a full shard run is necessary.

Changes to GitHub Actions must pass `actionlint` and `zizmor` as configured in
`.github/workflows/lint-actions.yml`.

Use `rg` instead of `grep` when possible.
