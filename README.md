# Anthelion [![License][license-badge]][license-link] ![Visitors](https://api.visitorbadge.io/api/visitors?path=https%3A%2F%2Fgithub.com%2FUnownPlain%2Fanthelion%2F&label=Visitors&labelColor=%230c0d10&countColor=%233a71c1)

[license-badge]: https://img.shields.io/github/license/UnownPlain/anthelion?style=for-the-badge&labelColor=0c0d10&color=3a71c1&&logo=data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTEwLjk2ODQgMi4zMjQ2NUMxMS41ODMgMS44NzYxNiAxMi40MTcgMS44NzYxNiAxMy4wMzE2IDIuMzI0NjVMMjAuNDUzNCA3Ljc0MDZDMjEuNDI5OSA4LjQ1MzE1IDIwLjkyNjggOS45OTgzNSAxOS43MTg5IDEwLjAwMDNINC4yODEwOEMzLjA3MzE4IDkuOTk4MzUgMi41NzAxMSA4LjQ1MzE1IDMuNTQ2NTcgNy43NDA2TDEwLjk2ODQgMi4zMjQ2NVpNMTMgNi4yNTAzNEMxMyA1LjY5ODA1IDEyLjU1MjMgNS4yNTAzNCAxMiA1LjI1MDM0QzExLjQ0NzcgNS4yNTAzNCAxMSA1LjY5ODA1IDExIDYuMjUwMzRDMTEgNi44MDI2MiAxMS40NDc3IDcuMjUwMzQgMTIgNy4yNTAzNEMxMi41NTIzIDcuMjUwMzQgMTMgNi44MDI2MiAxMyA2LjI1MDM0WiIgZmlsbD0iIzNhNzFjMSIvPgo8cGF0aCBkPSJNMTEuMjUgMTYuMDAwM0g5LjI1VjExLjAwMDNIMTEuMjVWMTYuMDAwM1oiIGZpbGw9IiMzYTcxYzEiLz4KPHBhdGggZD0iTTE0Ljc1IDE2LjAwMDNIMTIuNzVWMTEuMDAwM0gxNC43NVYxNi4wMDAzWiIgZmlsbD0iIzNhNzFjMSIvPgo8cGF0aCBkPSJNMTguNSAxNi4wMDAzSDE2LjI1VjExLjAwMDNIMTguNVYxNi4wMDAzWiIgZmlsbD0iIzNhNzFjMSIvPgo8cGF0aCBkPSJNMTguNzUgMTcuMDAwM0g1LjI1QzQuMDA3MzYgMTcuMDAwMyAzIDE4LjAwNzcgMyAxOS4yNTAzVjE5Ljc1MDNDMyAyMC4xNjQ1IDMuMzM1NzkgMjAuNTAwMyAzLjc1IDIwLjUwMDNIMjAuMjVDMjAuNjY0MiAyMC41MDAzIDIxIDIwLjE2NDUgMjEgMTkuNzUwM1YxOS4yNTAzQzIxIDE4LjAwNzcgMTkuOTkyNiAxNy4wMDAzIDE4Ljc1IDE3LjAwMDNaIiBmaWxsPSIjM2E3MWMxIi8+CjxwYXRoIGQ9Ik03Ljc1IDE2LjAwMDNINS41VjExLjAwMDNINy43NVYxNi4wMDAzWiIgZmlsbD0iIzNhNzFjMSIvPgo8L3N2Zz4K
[license-link]: https://github.com/UnownPlain/anthelion/blob/main/LICENSE.md

Scripts and tools used to automatically update some packages in the
[Windows Package Manager Community Repository](https://github.com/microsoft/winget-pkgs).

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
		"anthelion": "github:UnownPlain/anthelion#<commit>"
	}
}
```

Install dependencies and test one or more shards without submitting a pull request:

```sh
bun install
bun test:shard Package.Identifier
bun test:shard Package.One Package.Two --dry-run
```

Set `ANTHELION_SHARDS_DIR` when shards are not under the current working directory. Set
`KOMAC_GITHUB_OWNER` and `KOMAC_GITHUB_REPO` to update a repository other than
`microsoft/winget-pkgs`.

JSON shards use the published schema URL for completion and validation. TypeScript shards can import
the public helpers and use `defineShard` for return-value IntelliSense:

```ts
import { defineShard } from 'anthelion';
import { match } from 'anthelion/helpers';
import ky from 'ky';

export default defineShard(async () => {
	const page = await ky('https://example.com/downloads').text();
	const version = match(page, /example-(\d+(?:\.\d+)+)\.exe/i)[0]!;

	return {
		version,
		urls: [`https://example.com/example-${version}.exe`],
	};
});
```

# License

Licensed under [GPL-3.0-or-later][license-link].

Some of the regular expressions in this project are adapted / taken from
packages in the following repos:

- [Homebrew Casks](https://github.com/Homebrew/homebrew-cask)
- [Homebrew Core](https://github.com/Homebrew/homebrew-core)
- [Scoop](https://scoop.sh)
- [Chocolatey](https://community.chocolatey.org)
