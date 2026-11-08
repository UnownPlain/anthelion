# Anthelion [![License][license-badge]][license-link] ![Visitors](https://api.visitorbadge.io/api/visitors?path=https%3A%2F%2Fgithub.com%2FUnownPlain%2Fanthelion%2F&label=Visitors&labelColor=%230c0d10&countColor=%233a71c1)

[license-badge]: https://img.shields.io/badge/license-GPL--3.0%20%2B%20MIT-3a71c1?style=for-the-badge&labelColor=0c0d10&logo=data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTEwLjk2ODQgMi4zMjQ2NUMxMS41ODMgMS44NzYxNiAxMi40MTcgMS44NzYxNiAxMy4wMzE2IDIuMzI0NjVMMjAuNDUzNCA3Ljc0MDZDMjEuNDI5OSA4LjQ1MzE1IDIwLjkyNjggOS45OTgzNSAxOS43MTg5IDEwLjAwMDNINC4yODEwOEMzLjA3MzE4IDkuOTk4MzUgMi41NzAxMSA4LjQ1MzE1IDMuNTQ2NTcgNy43NDA2TDEwLjk2ODQgMi4zMjQ2NVpNMTMgNi4yNTAzNEMxMyA1LjY5ODA1IDEyLjU1MjMgNS4yNTAzNCAxMiA1LjI1MDM0QzExLjQ0NzcgNS4yNTAzNCAxMSA1LjY5ODA1IDExIDYuMjUwMzRDMTEgNi44MDI2MiAxMS40NDc3IDcuMjUwMzQgMTIgNy4yNTAzNEMxMi41NTIzIDcuMjUwMzQgMTMgNi44MDI2MiAxMyA2LjI1MDM0WiIgZmlsbD0iIzNhNzFjMSIvPgo8cGF0aCBkPSJNMTEuMjUgMTYuMDAwM0g5LjI1VjExLjAwMDNIMTEuMjVWMTYuMDAwM1oiIGZpbGw9IiMzYTcxYzEiLz4KPHBhdGggZD0iTTE0Ljc1IDE2LjAwMDNIMTIuNzVWMTEuMDAwM0gxNC43NVYxNi4wMDAzWiIgZmlsbD0iIzNhNzFjMSIvPgo8cGF0aCBkPSJNMTguNSAxNi4wMDAzSDE2LjI1VjExLjAwMDNIMTguNVYxNi4wMDAzWiIgZmlsbD0iIzNhNzFjMSIvPgo8cGF0aCBkPSJNMTguNzUgMTcuMDAwM0g1LjI1QzQuMDA3MzYgMTcuMDAwMyAzIDE4LjAwNzcgMyAxOS4yNTAzVjE5Ljc1MDNDMyAyMC4xNjQ1IDMuMzM1NzkgMjAuNTAwMyAzLjc1IDIwLjUwMDNIMjAuMjVDMjAuNjY0MiAyMC41MDAzIDIxIDIwLjE2NDUgMjEgMTkuNzUwM1YxOS4yNTAzQzIxIDE4LjAwNzcgMTkuOTkyNiAxNy4wMDAzIDE4Ljc1IDE3LjAwMDNaIiBmaWxsPSIjM2E3MWMxIi8+CjxwYXRoIGQ9Ik03Ljc1IDE2LjAwMDNINS41VjExLjAwMDNINy43NVYxNi4wMDAzWiIgZmlsbD0iIzNhNzFjMSIvPgo8L3N2Zz4K
[license-link]: https://github.com/UnownPlain/anthelion#license
[gpl-license]: https://github.com/UnownPlain/anthelion/blob/HEAD/LICENSE.md
[mit-license]: https://github.com/UnownPlain/anthelion/blob/HEAD/LICENSE-MIT.md

Anthelion monitors selected software projects for new releases, generates
updated WinGet manifests, and submits them to the
[Windows Package Manager Community Repository](https://github.com/microsoft/winget-pkgs).

See the [Shard Guide](CONTRIBUTING.md) to add or modify a package shard.

See [Using Anthelion from another repository](EXTERNAL.md) to install and configure it for your own shards.

## License

The repository is licensed under the [GNU General Public License version 3 or later][gpl-license].
Except where otherwise noted, files outside [`src`](src) are also available under the [MIT License][mit-license].

The complete application, including its MIT-licensed components and the
GPL-licensed [`@unownplain/anthelion-komac`](https://npmx.dev/package/@unownplain/anthelion-komac)
dependency, is governed by the GNU General Public License. The MIT-licensed
components remain independently available under the MIT License.

Some regular expressions used in this project are adapted from the following package repositories:

- [Homebrew](https://brew.sh)
- [Scoop](https://scoop.sh)
- [Chocolatey](https://community.chocolatey.org)
