import fs, { type FileRef } from '@rcompat/fs';
import { updateVersion } from '@unownplain/anthelion-komac';
import ansis from 'ansis';
import { limitAsync } from 'es-toolkit';
import ky from 'ky';
import { parse } from 'yaml';

import { getLatestRelease } from '@/github';
import {
	closeAllButMostRecentPR,
	checkVersionInRepo,
	get,
	isStateMatching,
	Logger,
	resolveVersionPlaceholders,
	updateVersionState,
	vs,
	normalizeVersion,
	resolveDataBackedUrls,
} from '@/helpers';
import { resolveReleaseNotes } from '@/release-notes';
import { JsonTaskSchema, Strategy, type JsonTask } from '@/schema/json-task';
import { normalizedReleaseNotesSchema } from '@/schema/release-notes';
import { ScriptTaskResult, type Urls } from '@/schema/script-task';
import {
	electronBuilder,
	pageMatch,
	redirectMatch,
	sortVersionsMatch,
	sourceforge,
} from '@/strategies';

const MAX_CONCURRENCY = 128;
export const SCRIPTS_FOLDER = 'tasks/script';
export const JSON_FOLDER = 'tasks/json';

type UpdateTaskOptions = {
	packageIdentifier: string;
	version: string;
	urls: Urls;
	releaseNotes: unknown;
	replace?: boolean;
	logger: Logger;
	githubTag?: string;
	github?: {
		owner: string;
		repo: string;
	};
};

async function updatePackage(options: UpdateTaskOptions) {
	const { packageIdentifier, version, urls, releaseNotes, replace, logger, githubTag, github } =
		options;
	const resolvedUrls = urls().map((url) => resolveVersionPlaceholders(url, version));
	const { releaseNotes: manifestReleaseNotes, releaseNotesUrl } = await resolveReleaseNotes(
		normalizedReleaseNotesSchema(version).safeParse(releaseNotes).data,
		packageIdentifier,
		version,
		githubTag,
		github,
	);

	logger.details(version, resolvedUrls);

	const updateResult = await updateVersion({
		packageIdentifier,
		version,
		urls: resolvedUrls,
		replace: replace ? 'latest' : undefined,
		releaseNotes: manifestReleaseNotes,
		releaseNotesUrl,
		dryRun: Boolean(process.env.DRY_RUN),
		token: process.env.GITHUB_TOKEN!,
	});

	logger.logUpdateResult(updateResult);

	if (replace) {
		await closeAllButMostRecentPR(packageIdentifier);
	}

	return updateResult;
}

async function handleScriptTask(fileName: string, logger: Logger) {
	const task = await import(`../${SCRIPTS_FOLDER}/${fileName}`);
	const { version, urls, releaseNotes, replace, skipPrCheck, state } = ScriptTaskResult.parse(
		await task.default(),
	);
	const packageIdentifier = fileName.replace('.ts', '');

	if (state && (await isStateMatching(packageIdentifier, state))) {
		logger.stateMatches(version);
		return null;
	}

	if (!skipPrCheck && (await checkVersionInRepo(version, packageIdentifier, logger))) return null;

	const updateResult = await updatePackage({
		packageIdentifier,
		version,
		urls,
		releaseNotes,
		replace,
		logger,
	});

	if (state) {
		await updateVersionState(packageIdentifier, state);
	}

	return updateResult;
}

async function resolveJsonTask(task: JsonTask, initialUrls: string[]) {
	switch (task.strategy) {
		case Strategy.GithubRelease: {
			const latest = await getLatestRelease({
				owner: task.github.owner,
				repo: task.github.repo,
				kind: task.github.preRelease ? 'prerelease' : 'stable',
				tagIncludes: task.github.tagFilter,
				useLatestEndpoint: task.github.fetchLatest,
			});

			return {
				version: latest.version,
				urls: () => {
					const releaseUrls = task.github.fetchUrlsFromApi ? latest.urls() : [];

					if (task.github.fetchUrlsFromApi && releaseUrls.length === 0) {
						throw new Error('No URLs found in GitHub release');
					}

					return initialUrls.concat(releaseUrls);
				},
				githubTag: latest.releaseTag,
			};
		}
		case Strategy.ElectronBuilder:
			return {
				version: await electronBuilder(task.electronBuilder.url),
				urls: () => initialUrls,
			};
		case Strategy.PageMatch:
			return {
				version: await pageMatch(task.pageMatch.url, new RegExp(task.pageMatch.regex, 'i')),
				urls: () => initialUrls,
			};
		case Strategy.SortVersions:
			return {
				version: await sortVersionsMatch(
					task.sortVersions.url,
					new RegExp(task.sortVersions.regex, 'i'),
				),
				urls: () => initialUrls,
			};
		case Strategy.Json: {
			const response = await ky(task.json.url).json();

			return {
				version: vs(get(response, task.json.path)),
				urls: () => resolveDataBackedUrls(initialUrls, response),
			};
		}
		case Strategy.RedirectMatch: {
			const result = await redirectMatch(
				task.redirectMatch.url,
				new RegExp(task.redirectMatch.regex, 'i'),
			);

			return {
				version: result.version,
				urls: () => (task.urls ? initialUrls : initialUrls.concat(result.url)),
			};
		}
		case Strategy.SourceForge:
			return {
				version: await sourceforge(task.sourceforge.project, task.sourceforge.file),
				urls: () => initialUrls,
			};
		case Strategy.Yaml: {
			const response = await ky(task.yaml.url).text();
			// This is set to failsafe so incorrectly quoted values aren't parsed as numbers
			const yaml = parse(response, { schema: 'failsafe' });

			return {
				version: vs(get(yaml, task.yaml.path)),
				urls: () => resolveDataBackedUrls(initialUrls, yaml),
			};
		}
	}
}

async function handleJsonTask(fileName: string, logger: Logger) {
	const file = await fs.ref(`./${JSON_FOLDER}/${fileName}`).json();
	const task = JsonTaskSchema.parse(file);
	const packageIdentifier = fileName.replace('.json', '');
	const resolvedTask = await resolveJsonTask(task, task.urls ?? []);
	const version = normalizeVersion(resolvedTask.version, task.versionRemove);

	if (await checkVersionInRepo(version, packageIdentifier, logger)) return null;

	return updatePackage({
		packageIdentifier,
		version,
		urls: resolvedTask.urls,
		releaseNotes: task.releaseNotes,
		replace: task.replace,
		logger,
		githubTag: resolvedTask.githubTag,
		github:
			task.strategy === Strategy.GithubRelease
				? { owner: task.github.owner, repo: task.github.repo }
				: undefined,
	});
}

async function executeTask(file: FileRef) {
	const logger = new Logger();

	logger.run(file.name);

	try {
		if (file.name.endsWith('ts')) {
			return {
				identifier: file.name,
				updateResult: await handleScriptTask(file.name, logger),
			};
		} else {
			return {
				identifier: file.name,
				updateResult: await handleJsonTask(file.name, logger),
			};
		}
	} catch (e) {
		logger.error(file.name, e);
		throw e;
	} finally {
		logger.flush();
	}
}

export async function runAllTasks(testTasks?: string[]) {
	const scripts = await fs.ref(SCRIPTS_FOLDER).list();
	const json = await fs.ref(JSON_FOLDER).list();
	let tasks: FileRef[] = scripts.concat(json);

	if (testTasks) {
		tasks = tasks.filter((task) => testTasks.includes(task.base));
	}

	if (tasks.length === 0) {
		console.log(ansis.red`Error: No tasks found`);
		process.exit(1);
	}

	console.log(`Found ${tasks.length} tasks to run\n`);

	const results = await Promise.allSettled(tasks.map(limitAsync(executeTask, MAX_CONCURRENCY)));

	const failures = results.flatMap((result, i) => {
		const file = tasks[i];
		if (result.status !== 'rejected' || !file) return [];
		return [{ result, file }];
	});

	const completed = `✅ Run completed: ${tasks.length - failures.length}/${tasks.length} tasks successful`;

	if (process.env.GITHUB_STEP_SUMMARY) {
		const generatedManifests = results.flatMap((result) => {
			if (result.status !== 'fulfilled') return [];
			const updateResult = result.value.updateResult;
			if (!updateResult || updateResult.changes.length === 0) return [];

			return [updateResult];
		});

		const runErrors = failures
			.map(
				(failedTask) =>
					`### ❌ Error in ${failedTask.file.name}\n\`\`\`\n${ansis.strip(failedTask.result.reason.message)}\n\`\`\`\n`,
			)
			.join('');

		const summarySections = ['# Summary', '', completed];

		if (generatedManifests.length > 0) {
			summarySections.push('', '## Generated Manifests', '');

			for (const task of generatedManifests) {
				summarySections.push(
					`### ${task.packageIdentifier}`,
					`Version: ${task.version}`,
					`Pull Request: ${task.pullRequestUrl ?? 'Dry Run'}`,
					'',
					'<details>',
					'<summary>Manifests</summary>',
					'',
				);

				for (const manifest of task.changes) {
					summarySections.push(
						`#### ${manifest.path}`,
						'',
						'```yaml',
						manifest.content.trimEnd(),
						'```',
						'',
					);
				}

				summarySections.push('</details>', '');
			}
		}

		if (runErrors) {
			summarySections.push('', '## Run Errors', '', runErrors);
		}

		const summary = summarySections.join('\n');

		await fs.ref(process.env.GITHUB_STEP_SUMMARY).write(summary);
	}

	console.log(completed);

	return failures.length;
}

if (import.meta.main) {
	await runAllTasks();
}
