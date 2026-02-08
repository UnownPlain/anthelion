## Overview

This project automatically updates packages in the Windows Package Manager (WinGet) Community Repository. It is written in TypeScript and uses Bun as its JavaScript runtime and package manager. The latest version of a package is automatically fetched and the manifest creator komac (written in Rust) is invoked under the hood to update the packages. The project is run on a schedule using GitHub Actions (`.github/workflows/update-packages.yml`).

The source code is located in the `src` folder and the tasks (definitions on how to fetch the latest version for a package) are located in the `tasks` folder. Tasks are split into 2 types: script and JSON. Tasks are written in JSON whenever possible and scripts are used only if a package can't be updated declaratively.

## Testing Changes

- To test a specific task, run:

  ```bash
  bun pkgtest {TASK_NAME} --dry-run
  ```

- To perform a run for all tasks, use:

  ```bash
  bun start
  ```

  > **Warning:** Only run this if you absolutely need to.

## Other Useful Commands

| Command          | Description                                                        |
| ---------------- | ------------------------------------------------------------------ |
| `bun lint`       | Lint code AND type check with **oxlint**                           |
| `bun format`     | Format code with **oxfmt**                                         |
| `bun gen-schema` | Regenerate JSON schema after modifying `src/schema/task_schema.ts` |

## Regex Guidelines

Taken from https://docs.brew.sh/Brew-Livecheck

1. **Capture only the version**  
   Use a **single capturing group** around the version text.  
   Example:

   ```regex
   href=._?example-v?(\d+(?:\.\d+)+)(?:-src)?\.t
   ```

   - Only `(\d+(?:\.\d+)+)` captures the version (e.g., `1.2`, `1.2.3`).
   - All other parts are non‑capturing (`(?:…)`).

2. **Anchor the start/end**  
   Restrict the match to a specific context (e.g., file names or version directories in an `href`).  
   Example:

   ```regex
   href=._?example[._-]v?(\d+(?:\.\d+)+)\.zip
   ```

3. **Avoid generic catch‑alls**  
   Prefer context‑specific patterns over `.*` or `.+`.  
   Example for matching inside an HTML attribute:

   ```regex
   [^"' >]+?
   ```

4. **Use `[._-]` for separators**  
   Replace a period, underscore, or hyphen between the software name and version with `[._-]`.  
   Example for files like `example-1.2.3.tar.gz`, `example_1.2.3.tar.gz`, or `example.1.2.3.tar.gz`:

   ```regex
   example[._-]v?(\d+(?:\.\d+)+)\.t
   ```

5. **Regexes should be made case insensitive**
   Whenever possible, by adding i at the end (e.g. /.../i). This improves reliability, as the regex will handle changes in letter case without needing modifications.

   > IMPORTANT:
   >
   > This is only applicable to script (.ts) files. Regex in JSON files are insensitive by default.

## Tips

- Use `rg` over `grep` whenever possible.
