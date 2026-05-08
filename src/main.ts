import fs, { type FileRef } from '@rcompat/fs';
import { updateVersion } from '@unownplain/anthelion-komac';
import ansis from 'ansis';
import { limitAsync } from 'es-toolkit';
import ky from 'ky';
import { parse } from 'yaml';

import { getLatestRelease, getLatestReleaseFromRedirect } from '@/github';
import {
	closeAllButMostRecentPR,
	checkVersionInRepo,
	formatDuration,
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

const MAX_CONCURRENCY = 256;
export const SCRIPTS_FOLDER = 'tasks/script';
export const JSON_FOLDER = 'tasks/json';

type TaskTimings = Record<string, number>;

async function timeBucket<T>(timings: TaskTimings, name: string, fn: () => T | Promise<T>) {
	const start = performance.now();
	try {
		return await fn();
	} finally {
		timings[name] = (timings[name] ?? 0) + performance.now() - start;
	}
}

type UpdateTaskOptions = {
	packageIdentifier: string;
	version: string;
	urls: Urls;
	releaseNotes: unknown;
	replace?: boolean;
	installerMatches?: string[];
	logger: Logger;
	githubTag?: string;
	github?: {
		owner: string;
		repo: string;
	};
};

async function updatePackage(options: UpdateTaskOptions, timings: TaskTimings) {
	const {
		packageIdentifier,
		version,
		urls,
		releaseNotes,
		replace,
		installerMatches,
		logger,
		githubTag,
		github,
	} = options;
	const resolvedUrls = (await urls()).map((url) => resolveVersionPlaceholders(url, version));
	const { releaseNotes: manifestReleaseNotes, releaseNotesUrl } = await timeBucket(
		timings,
		'releaseNotes',
		() =>
			resolveReleaseNotes(
				normalizedReleaseNotesSchema(version).safeParse(releaseNotes).data,
				packageIdentifier,
				version,
				githubTag,
				github,
			),
	);

	logger.details(version, resolvedUrls);

	const updateResult = await timeBucket(timings, 'updateVersion', () =>
		updateVersion({
			packageIdentifier,
			version,
			urls: resolvedUrls,
			replace: replace ? 'latest' : undefined,
			releaseNotes: manifestReleaseNotes,
			releaseNotesUrl,
			installerMatches,
			dryRun: Boolean(process.env.DRY_RUN),
			token: process.env.GITHUB_TOKEN!,
		}),
	);

	logger.logUpdateResult(updateResult);

	if (replace) {
		await timeBucket(timings, 'closeOldPRs', () => closeAllButMostRecentPR(packageIdentifier));
	}

	return updateResult;
}

async function handleScriptTask(fileName: string, logger: Logger, timings: TaskTimings) {
	const task = await timeBucket(
		timings,
		'loadTask',
		() => import(`../${SCRIPTS_FOLDER}/${fileName}`),
	);
	const { version, urls, releaseNotes, replace, skipPrCheck, state, installerMatches } =
		await timeBucket(timings, 'resolveLatest', async () =>
			ScriptTaskResult.parse(await timeBucket(timings, 'resolveScriptBody', () => task.default())),
		);
	const packageIdentifier = fileName.replace('.ts', '');
	const resolvedVersion = vs(typeof version === 'function' ? version() : version);

	if (
		state &&
		(await timeBucket(timings, 'stateCheck', () => isStateMatching(packageIdentifier, state)))
	) {
		logger.stateMatches();
		return null;
	}

	if (
		!skipPrCheck &&
		(await timeBucket(timings, 'repoCheck', () =>
			checkVersionInRepo(resolvedVersion, packageIdentifier, logger),
		))
	) {
		return null;
	}

	const updateResult = await updatePackage(
		{
			packageIdentifier,
			version: resolvedVersion,
			urls,
			releaseNotes,
			installerMatches,
			replace,
			logger,
		},
		timings,
	);

	if (state) {
		await timeBucket(timings, 'stateUpdate', () => updateVersionState(packageIdentifier, state));
	}

	return updateResult;
}

async function resolveJsonTask(task: JsonTask, initialUrls: string[], timings: TaskTimings) {
	switch (task.strategy) {
		case Strategy.GithubRelease: {
			const needsApiData =
				task.github.fetchUrlsFromApi ||
				task.github.preRelease ||
				task.github.tagFilter ||
				task.github.fetchLatest;
			const latest = needsApiData
				? await timeBucket(timings, 'resolveGithubApi', () =>
						getLatestRelease({
							owner: task.github.owner,
							repo: task.github.repo,
							kind: task.github.preRelease ? 'prerelease' : 'stable',
							tagIncludes: task.github.tagFilter,
							useLatestEndpoint: task.github.fetchLatest,
							perPage: task.github.perPage,
						}),
					)
				: await timeBucket(timings, 'resolveGithubRedirect', () =>
						getLatestReleaseFromRedirect({
							owner: task.github.owner,
							repo: task.github.repo,
						}),
					);

			return {
				version: latest.version,
				urls: () => {
					const releaseUrls = task.github.fetchUrlsFromApi ? latest.urls() : [];

					if (task.github.fetchUrlsFromApi && releaseUrls.length === 0) {
						throw new Error('No URLs found in GitHub release');
					}

					return initialUrls.concat(releaseUrls);
				},
				githubTag: latest.rawTag,
			};
		}
		case Strategy.ElectronBuilder:
			return {
				version: await timeBucket(timings, 'resolveElectronBuilder', () =>
					electronBuilder(task.electronBuilder.url),
				),
				urls: () => initialUrls,
			};
		case Strategy.PageMatch:
			return {
				version: await timeBucket(timings, 'resolvePageMatch', () =>
					pageMatch(task.pageMatch.url, new RegExp(task.pageMatch.regex, 'i')),
				),
				urls: () => initialUrls,
			};
		case Strategy.SortVersions:
			return {
				version: await timeBucket(timings, 'resolveSortVersions', () =>
					sortVersionsMatch(task.sortVersions.url, new RegExp(task.sortVersions.regex, 'i')),
				),
				urls: () => initialUrls,
			};
		case Strategy.Json: {
			const response = await timeBucket(timings, 'resolveJsonFetch', () =>
				ky(task.json.url).json(),
			);

			return {
				version: vs(get(response, task.json.path)),
				urls: () => resolveDataBackedUrls(initialUrls, response),
			};
		}
		case Strategy.RedirectMatch: {
			const result = await timeBucket(timings, 'resolveRedirectMatch', () =>
				redirectMatch(task.redirectMatch.url, new RegExp(task.redirectMatch.regex, 'i')),
			);

			return {
				version: result.version,
				urls: () => (task.urls ? initialUrls : initialUrls.concat(result.url)),
			};
		}
		case Strategy.SourceForge:
			return {
				version: await timeBucket(timings, 'resolveSourceForge', () =>
					sourceforge(task.sourceforge.project, task.sourceforge.file),
				),
				urls: () => initialUrls,
			};
		case Strategy.Yaml: {
			const response = await timeBucket(timings, 'resolveYamlFetch', () =>
				ky(task.yaml.url).text(),
			);
			// This is set to failsafe so incorrectly quoted values aren't parsed as numbers
			const yaml = parse(response, { schema: 'failsafe' });

			return {
				version: vs(get(yaml, task.yaml.path)),
				urls: () => resolveDataBackedUrls(initialUrls, yaml),
			};
		}
	}
}

async function handleJsonTask(fileName: string, logger: Logger, timings: TaskTimings) {
	const task = await timeBucket(timings, 'loadTask', async () => {
		const file = await fs.ref(`./${JSON_FOLDER}/${fileName}`).json();
		return JsonTaskSchema.parse(file);
	});
	const packageIdentifier = fileName.replace('.json', '');
	const resolvedTask = await timeBucket(timings, 'resolveLatest', () =>
		resolveJsonTask(task, task.urls ?? [], timings),
	);
	const version = normalizeVersion(resolvedTask.version, task.versionRemove);

	if (
		await timeBucket(timings, 'repoCheck', () =>
			checkVersionInRepo(version, packageIdentifier, logger),
		)
	) {
		return null;
	}

	return updatePackage(
		{
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
		},
		timings,
	);
}

async function executeTask(file: FileRef) {
	const logger = new Logger();
	const timings: TaskTimings = {};
	const start = performance.now();

	logger.run(file.name);

	try {
		if (file.name.endsWith('ts')) {
			return {
				identifier: file.name,
				updateResult: await handleScriptTask(file.name, logger, timings),
				timings,
			};
		} else {
			return {
				identifier: file.name,
				updateResult: await handleJsonTask(file.name, logger, timings),
				timings,
			};
		}
	} catch (e) {
		logger.error(file.name, e);
		throw e;
	} finally {
		logger.timings(timings);
		logger.duration(file.name, performance.now() - start);
		logger.blankLine();
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
	logTimingSummary(results);

	return failures.length;
}

function logTimingSummary(
	results: PromiseSettledResult<Awaited<ReturnType<typeof executeTask>>>[],
) {
	const totals: TaskTimings = {};
	const counts: Record<string, number> = {};
	const maxes: Record<string, { identifier: string; milliseconds: number }> = {};

	for (const result of results) {
		if (result.status !== 'fulfilled') continue;

		for (const [name, milliseconds] of Object.entries(result.value.timings)) {
			totals[name] = (totals[name] ?? 0) + milliseconds;
			counts[name] = (counts[name] ?? 0) + 1;

			const max = maxes[name];
			if (!max || milliseconds > max.milliseconds) {
				maxes[name] = { identifier: result.value.identifier, milliseconds };
			}
		}
	}

	if (Object.keys(totals).length === 0) return;

	console.log('\nTiming summary');
	for (const [name, total] of Object.entries(totals).sort((a, b) => b[1] - a[1])) {
		const max = maxes[name];
		const average = total / (counts[name] ?? 1);
		const maxText = max ? `, max ${formatDuration(max.milliseconds)} (${max.identifier})` : '';
		console.log(
			`${name}: total ${formatDuration(total)}, avg ${formatDuration(average)}, count ${
				counts[name] ?? 0
			}${maxText}`,
		);
	}
}

if (import.meta.main) {
	await runAllTasks();
}
