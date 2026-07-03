# Shard Guide

A shard tells Anthelion how to find the latest version of a package and where to download its
Windows installers/binaries. Anthelion uses that information to generate and submit an update to the
[WinGet Community Repository](https://github.com/microsoft/winget-pkgs).

This guide walks through writing, testing, and submitting a shard.

## Before you start

A Unix-like development environment is recommended. On Windows,
[Windows Subsystem for Linux (WSL)](https://learn.microsoft.com/windows/wsl/install) is highly recommended.

The Bun JavaScript toolkit is required. See https://bun.sh/docs/installation for installation.

Alternatively, use [mise](https://mise.jdx.dev/getting-started.html) to install the pinned development tools.
After installing mise and activating it for your shell, run `mise install`.

Install project dependencies:

```sh
bun ci
```

Copy the environment template and fill in the values before running a shard:

```sh
cp .env.example .env
```

At minimum, a `GITHUB_TOKEN` with zero permissions is required. Bun loads `.env` automatically,
and the file is ignored by Git. Never commit tokens.

The other variables are needed only for the corresponding workflow:

- `GITHUB_REPOSITORY_OWNER`, `GITHUB_REPOSITORY`, and `GITHUB_REF_NAME` identify the Anthelion
  repository and branch whose `version-state` files are updated during a real run.
- `KOMAC_FORK_OWNER` identifies the fork where komac creates branches for WinGet submissions.
- `KOMAC_GITHUB_OWNER` and `KOMAC_GITHUB_REPO` override the target repository; they default to
  `microsoft/winget-pkgs`.
- `GROQ_API_KEY` is required only when release-note cleanup is enabled.
- `CLOUDFLARE_ACCOUNT_ID` and `CLOUDFLARE_API_TOKEN` are required only for
  `browser-rendering` release notes.

The GitHub token used for a real run must have permission to update the configured Anthelion
repository, push to the komac fork, and open pull requests against the target repository. A focused
`--dry-run` does not update state or open a pull request.

Find the package identifier in the WinGet repository or with:

```sh
winget search <package>
```

Before adding a shard, check that:

- The package already exists in the WinGet Community Repository.
- A shard with the same package identifier does not already exist in `shards/json` or
  `shards/script`.
- Upstream publishes a stable way to discover the latest version and download the Windows
  installer.

## Researching how a package updates

Check other package repositories update the package before building version detection from scratch:

- [Homebrew](https://brew.sh)'s Livecheck
- [Scoop](https://scoop.sh)'s checkver
- [Chocolatey](https://community.chocolatey.org)'s chocolatey-au

Their package definitions may reveal an official release API, update feed, version pattern, or
stable installer URL. Treat these definitions as research rather than authoritative sources:
verify the behavior against the publisher's official endpoints.

For an application with a built-in auto-updater, run it in a disposable Windows virtual machine
and capture its update check with [Fiddler](https://www.telerik.com/download/fiddler)
(`Telerik.Fiddler.Classic`) or [Proxyman](https://proxyman.com/windows)
(`Proxyman.Proxyman`). The request or response often exposes the update feed that should drive the
shard. Keep the capture isolated from personal accounts and unrelated traffic, especially when
installing a proxy certificate for HTTPS inspection.

## Writing your first shard

Use a JSON shard whenever the latest version and installer URLs can be described declaratively.
Name the file after the exact WinGet package identifier:

```text
shards/json/Publisher.Package.json
```

For a package in the WinGet font repository, append `.Font` to the package identifier:

```text
shards/json/Publisher.FontFamily.Font.json
```

The `.Font` suffix marks the shard as a font and is not part of the package identifier.

The schema provides editor completion and validates the fields allowed by each strategy.
`{version}` is replaced with the detected, normalized version.

Test the shard without opening a pull request:

```sh
bun test:shard Publisher.Package --dry-run
```

Inspect the generated manifests and confirm:

- The detected version matches the latest stable upstream release.
- Every URL resolves to the intended Windows installer.
- All architectures and installer types already represented by the WinGet package are included.

Omitting `--dry-run` while developing a shard can submit a pull request to the configured WinGet repository.

## Choosing a strategy

Choose the most specific strategy that fits the upstream source. Prefer a JSON shard even when its
configuration is slightly longer than a script.

| Strategy           | Use it when                                                                                                |
| ------------------ | ---------------------------------------------------------------------------------------------------------- |
| `github-release`   | The package publishes versioned GitHub releases.                                                           |
| `electron-builder` | The app publishes an Electron Builder `latest.yml` or equivalent channel file.                             |
| `json`             | An API or metadata file contains the version.                                                              |
| `yaml`             | A YAML document contains the version.                                                                      |
| `page-match`       | One contextual regular-expression match on a page contains the version.                                    |
| `sort-versions`    | A page lists several versions and the greatest version must be selected.                                   |
| `redirect-match`   | A stable URL redirects to a versioned installer URL.                                                       |
| `sourceforge`      | Releases are hosted in a SourceForge project.                                                              |
| `static`           | No upstream version lookup is needed; pass a fixed value or installer metadata selector directly to komac. |

### GitHub Releases

The default GitHub strategy reads the latest release and applies `urls` as templates:

```json
{
	"$schema": "https://anthelion.unownplain.dev/schema.json",
	"strategy": "github-release",
	"github": { "owner": "example", "repo": "example" },
	"urls": [
		"https://github.com/example/example/releases/download/v{version}/example_{version}_x64.msi",
		"https://github.com/example/example/releases/download/v{version}/example_{version}_arm64.msi"
	]
}
```

Useful `github` options are:

- `preRelease`: select prereleases instead of stable releases.
- `tagFilter`: only consider tags containing the given text.
- `fetchLatest`: use GitHub's latest-release API endpoint.
- `perPage`: change how many releases are inspected.
- `fetchUrlsFromApi`: use every asset URL returned by GitHub instead of URL templates. Do not add
  `urls` when this is enabled.

GitHub templates can also use `{github.version}`, `{github.tag}`, `{github.rawTag}`, and
`{github.title}`.

### Electron Builder

Point the strategy at the channel YAML file and provide installer URL templates:

```json
{
	"$schema": "https://anthelion.unownplain.dev/schema.json",
	"strategy": "electron-builder",
	"electronBuilder": {
		"url": "https://example.com/releases/latest.yml"
	},
	"urls": ["https://example.com/releases/example-{version}-setup.exe"]
}
```

### JSON and YAML data

Use a dot-separated `path` to select the version. Numeric path components address array indexes.
Installer entries may be paths into the same response instead of literal URLs:

```json
{
	"$schema": "https://anthelion.unownplain.dev/schema.json",
	"strategy": "json",
	"json": {
		"url": "https://example.com/releases.json",
		"path": "releases.0.version"
	},
	"urls": ["releases.0.downloads.windows_x64"]
}
```

The `yaml` strategy has the same shape, using a `yaml` object instead of `json`.

### Matching a web page

Use `page-match` when one match identifies the current version:

```json
{
	"$schema": "https://anthelion.unownplain.dev/schema.json",
	"strategy": "page-match",
	"pageMatch": {
		"url": "https://example.com/downloads",
		"regex": "href=[\"'][^\"']*example[._-]v?(\\d+(?:\\.\\d+)+)-x64\\.exe[\"']"
	},
	"urls": ["https://example.com/downloads/example-{version}-x64.exe"]
}
```

The first capture group is the version. A named `version` group also works. Other named groups are
available in templates as `{captures.name}`.

Use `sort-versions` when a page lists multiple releases:

```json
{
	"$schema": "https://anthelion.unownplain.dev/schema.json",
	"strategy": "sort-versions",
	"sortVersions": {
		"url": "https://example.com/releases/",
		"regex": "href=[\"']v?(\\d+(?:\\.\\d+)+)/[\"']"
	},
	"urls": ["https://example.com/releases/{version}/example-{version}.exe"]
}
```

JSON shard regexes are automatically case-insensitive.

### Redirecting download URLs

Use `redirect-match` when a stable download link redirects to a URL containing the version:

```json
{
	"$schema": "https://anthelion.unownplain.dev/schema.json",
	"strategy": "redirect-match",
	"redirectMatch": {
		"url": "https://example.com/download/windows",
		"regex": "releases/(\\d+(?:\\.\\d+)+)/example\\.msi"
	}
}
```

If `urls` is omitted, Anthelion passes the redirect destination to komac.

### SourceForge

```json
{
	"$schema": "https://anthelion.unownplain.dev/schema.json",
	"strategy": "sourceforge",
	"sourceforge": {
		"project": "example",
		"file": "example-{version}-setup.exe"
	},
	"urls": ["https://prdownloads.sourceforge.net/example/example-{version}-setup.exe"]
}
```

The optional `file` pattern narrows the project feed when it contains unrelated downloads.

### Installer-derived versions and update state

Unlike the other strategies, `static` does not fetch or extract a version. It passes the required
`version` value directly to komac. This is useful for an unversioned download URL when komac can
derive the real version during installer analysis:

```json
{
	"$schema": "https://anthelion.unownplain.dev/schema.json",
	"strategy": "static",
	"version": "productVersion",
	"urls": ["https://example.com/download/latest.exe"],
	"replace": true
}
```

The installer metadata selectors are `displayVersion`, `productVersion`, and `fileVersion`.
`installerMatches` determines which executable supplies that metadata when the download is an
archive. A concrete version may also be supplied, although another strategy should normally
discover versions that upstream publishes.

Because an installer-derived version is unknown until komac downloads and analyzes the file,
Anthelion cannot perform its normal version check first. Add `state` as a cheap upstream change
token to avoid analyzing the same file on every scheduled run:

```json
"state": {
	"source": "response-header",
	"url": "https://example.com/download/latest.exe",
	"header": "etag"
}
```

Anthelion compares the header with `version-state/<Package.Identifier>`. A match skips the update.
After a successful update, Anthelion writes the new value to that file. Dry runs intentionally
ignore stored state so the shard can still be tested.

Use an `etag`, content hash, or `last-modified` value that changes whenever the installer changes.
The state URL may differ from the installer URL, as with a metadata or CDN endpoint. Use
`"method": "get"` only when the server does not support `HEAD`.

State is available to every JSON strategy. Use `source: "value"` when the strategy already
resolved a suitable token:

```json
"state": {
	"source": "value",
	"value": "{github.rawTag}"
}
```

This is useful when `version` is a komac metadata selector but the release tag can identify whether
that installer has already been processed.

Set `replace` to `true` when the previous latest package version should not remain in the WinGet
repository. Instead of adding a new version directory alongside it, komac replaces the latest
version: the manifest directory moves to the new version and its version fields, installer hashes,
and other changed metadata are updated. This is commonly needed for rolling releases and
installers that reuse the same URL across versions.

Do not enable `replace` merely because a shard is `static`. Historical versions should normally be
preserved when their installer URLs remain valid. `replace` and `state` solve separate problems and
neither implies the other.

## URL and version templates

Literal URLs and templates can be mixed. Available placeholders depend on the strategy, but
`{version}` is always available after version resolution.

A placeholder can replace text within its value:

```text
https://example.com/{version|.|-}/example.exe
```

This replaces every `.` in the version with `-`.

Append `|architecture` to an installer URL to override the architecture detected by komac:

```json
"urls": [
	"https://example.com/example-{version}-i686-win32.zip|x86",
	"https://example.com/example-{version}-amd64-win32.zip|x64"
]
```

The suffix is metadata passed to komac and is not part of the download URL. Supported values are
`x86`, `x64`, `arm`, `arm64`, and `neutral`. Use an override when the installer metadata does not
identify the correct architecture.

Use `versionRemove` when upstream decorates a version with a fixed prefix or suffix:

```json
"versionRemove": "-stable"
```

Anthelion already removes a leading `v`; do not use `versionRemove` solely for that.

Set `version` only when the strategy's detected value must be overridden. For a normal versioned
release, fixing the source or regex is preferable to hard-coding a version.

The `version` field supports templates. Within this field, `{version}` is the normalized version
detected by the strategy:

```json
"version": "{version}.0"
```

For example, if the strategy detects `1.2`, the package version becomes `1.2.0`. In subsequent
templates, `{version}` remains the detected version and `{packageVersion}` is the final overridden
package version.

## Selecting installer metadata inside archives

`installerMatches` is primarily useful for `static` shards that use `displayVersion`,
`productVersion`, or `fileVersion`. When an archive contains multiple executables, it restricts
komac's nested-installer analysis to the executable that supplies the package version:

```json
"installerMatches": ["example.exe"]
```

Plain values are case-insensitive substring matches. Values containing glob metacharacters are
treated as glob patterns. Match as narrowly as necessary to select the intended installer.

Do not add `installerMatches` to an ordinary version-discovery shard just because its download is
an archive. It is unnecessary unless komac must select a particular nested installer for analysis.

## Adding release notes

Release notes are optional but preferred when upstream publishes useful per-release information.
Omit `releaseNotes` when the installers come from the same GitHub release; komac resolves those
release notes automatically from the GitHub URLs.

Add a GitHub release-notes configuration only when cleanup is required:

```json
"releaseNotes": {
	"source": "github",
	"cleanup": true
}
```

It is also needed when the release notes come from another GitHub repository. Specify that
repository and the tag template:

```json
"releaseNotes": {
	"source": "github",
	"owner": "example",
	"repo": "release-notes",
	"tag": "v{version}"
}
```

For a non-GitHub changelog or release page, choose its source format:

```json
"releaseNotes": {
	"source": "markdown",
	"sourceUrl": "https://example.com/CHANGELOG.md",
	"releaseNotesUrl": "https://example.com/releases/{version}",
	"characterLimit": 5000
}
```

Supported sources are `github`, `html`, `markdown`, `plain-text`, `json`, `yaml`, and
`browser-rendering`. If only a link is useful, provide just `releaseNotesUrl`.

Use `cleanup` only when the fetched content needs cleanup. Avoid browser rendering if a direct
HTML, Markdown, JSON, or YAML source exists.

## Regular expressions

Keep patterns narrow enough that an unrelated link or historical version cannot become the latest
version:

1. Capture only the version. Use exactly one capture group unless named captures are needed for
   templates; make all structural groups non-capturing.
2. Anchor the match to a product name, file name, directory, or HTML attribute.
3. Avoid generic `.*` and `.+`. Within an attribute, prefer a bounded class such as `[^"' >]+`.
4. Use `[._-]` when upstream may separate a product name and version with `.`, `_`, or `-`.
5. In script shards, add the `i` flag. JSON shard regexes are already case-insensitive.

For example:

```regex
href=["'][^"']*example[._-]v?(\d+(?:\.\d+)+)(?:-setup)?\.exe["']
```

Test the expression against both the current page and older entries on the page. A successful match
is insufficient if it can select the wrong product, architecture, channel, or prerelease.

## Writing a script shard

Use a TypeScript shard only when the declarative strategies cannot express the upstream workflow.
Name it after the exact package identifier:

```text
shards/script/Publisher.Package.ts
```

For example, Git for Windows tags releases as `2.50.1.windows.1`, but the MinGit package version is
`2.50.1`. Later rebuilds, such as `.windows.2`, become `2.50.1.2`. A script can apply that
conditional transformation while retaining the original tag for the download URLs:

```ts
import { getLatestReleaseFromRedirect } from '@/github.ts';
import { match } from '@/helpers';

export default async function () {
	const release = await getLatestReleaseFromRedirect({
		owner: 'git-for-windows',
		repo: 'git',
	});
	const [baseVersion, buildNumber] = match(release.tag, /^(\d+(?:\.\d+)+)\.windows\.(\d+)$/);
	const version = buildNumber === '1' ? baseVersion : `${baseVersion}.${buildNumber}`;

	return {
		version,
		urls: [
			`https://github.com/git-for-windows/git/releases/download/${release.rawTag}/MinGit-${version}-32-bit.zip`,
			`https://github.com/git-for-windows/git/releases/download/${release.rawTag}/MinGit-${version}-64-bit.zip`,
			`https://github.com/git-for-windows/git/releases/download/${release.rawTag}/MinGit-${version}-arm64.zip`,
		],
	};
}
```

Within this repository, existing shards may use the equivalent `@/helpers` and `@/strategies`
imports. `defineShard` validates the returned shape at type-check time.

The return value supports:

- `version`: a string, or a function when `state` is also returned.
- `urls`: an array or a function returning an array.
- `releaseNotes`, `replace`, and `installerMatches`: the same concepts as JSON shards.
- `state`: a persisted value used to skip unchanged downloads.
- `skipPrCheck`: skip checking whether the version or pull request already exists; use this only
  when the normal check cannot represent the update.

Keep network requests and parsing inside the default function. Reuse helpers from `src/helpers.ts`
and `src/strategies.ts` instead of duplicating version matching or comparison code.

## Testing and submitting

Format and validate the repository:

```sh
bun fmt
bun lint
```

Then run the focused shard test again:

```sh
bun test:shard Publisher.Package --dry-run
```

Do not run `bun start` merely to validate one contribution; it runs every shard.

Before submitting:

- Keep the change limited to the shard and directly related documentation or state.
- Explain any non-obvious regex, state value, `replace`, or script-only implementation.
- Confirm that upstream URLs are official and use HTTPS where available.

## Troubleshooting

### No shard was found

The filename, excluding `.json` or `.ts`, must exactly equal the package identifier passed to
`bun test:shard`. Check both capitalization and punctuation.

### The wrong version was detected

Make the regex or data path more specific. Check for prereleases, unrelated products, old releases,
and tags with fixed prefixes or suffixes. Use `tagFilter` or `versionRemove` only for stable,
well-defined upstream conventions.

### A URL placeholder cannot be resolved

Check that the placeholder is available for the chosen strategy. Data-backed URL paths apply only
to `json` and `yaml`; named captures apply only to `page-match`; GitHub metadata applies only to
`github-release`.

### komac derived the version from the wrong executable

For a `static` shard using an installer metadata selector, add `installerMatches` to select the
intended executable inside the archive.

### An unversioned installer is analyzed repeatedly

Add state based on an `etag`, content hash, `last-modified`, release tag, or another token that
changes with the installer. Set `replace` separately only when the previous latest manifest
version must be removed.

### The JSON format is not expressive enough

First check whether another strategy or a named capture can remove the need for code. If the
workflow genuinely needs multiple requests, custom parsing, or conditional URL construction, use a
script shard and keep it focused on those operations.

## AI policy

AI tools, including LLMs, may be used for coding. Contributors remain
responsible for any code they publish, and maintainers remain responsible for
any code they merge and release. All contributions are held to a high standard.

**AI should not be used to generate comments or PR descriptions when communicating with
maintainers**. Comments must be written by humans. Comments believed to be AI generated
may be hidden.

When opening an issue, describe the problem in your own words.

When opening a pull request, be prepared to explain the proposed changes in your
own words. This includes the pull request body and responses to questions. **Do
not copy responses from AI when replying to questions from maintainers.**

A human who understands any AI-produced work must remain in the loop.
**Autonomous agents may not be used to contribute to this project**. Pull
requests believed to have been created autonomously will be closed.

If you wish to include context from an interaction with AI in your comments, it
must be in a quote block (e.g., using `>`) and disclosed as such. It must be
accompanied by human commentary explaining the relevance and implications of the
context. Do not share long snippets.

AI may help non-native English speakers communicate. If using AI to edit
comments for this purpose, ensure the result reflects your own voice and ideas.
For translation, consider writing in your native language and including the AI
translation in a quote block.

This policy was adapted from [Astral's AI policy](https://github.com/astral-sh/.github/blob/HEAD/AI_POLICY.md).
