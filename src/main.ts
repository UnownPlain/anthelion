import fs, { type FileRef } from '@rcompat/fs';
import { updateVersion } from '@unownplain/anthelion-komac';
import ansis from 'ansis';
import { getProperty } from 'dot-prop';
import { limitAsync } from 'es-toolkit';
import ky from 'ky';
import { parse } from 'yaml';

import { getLatestVersion } from '@/github';
import {
	closeAllButMostRecentPR,
	Logger,
	resolveVersionPlaceholders,
	vs,
	checkVersionInRepo,
	isStateMatching,
	updateVersionState,
	isHttpUrl,
} from '@/helpers';
import { resolveReleaseNotes } from '@/release-notes';
import { JsonTaskSchema, Strategy } from '@/schema/json-task';
import { normalizedReleaseNotesSchema } from '@/schema/release-notes';
import { ScriptTaskResult } from '@/schema/script-task';
import {
	electronBuilder,
	pageMatch,
	redirectMatch,
	sortVersionsMatch,
	sourceforge,
} from '@/strategies';

const MAX_CONCURRENCY = 32;
export const SCRIPTS_FOLDER = 'tasks/script';
export const JSON_FOLDER = 'tasks/json';

async function handleScriptTask(fileName: string, logger: Logger) {
	const task = await import(`../${SCRIPTS_FOLDER}/${fileName}`);
	const { version, urls, releaseNotes, replace, skipPrCheck, state } = ScriptTaskResult.parse(
		await task.default(),
	);
	const packageIdentifier = fileName.replace('.ts', '');

	if (!skipPrCheck && (await checkVersionInRepo(version, packageIdentifier, logger))) return [];

	if (state && (await isStateMatching(packageIdentifier, state))) {
		logger.stateMatches(version);
		return [];
	}

	logger.details(version, urls);

	const { releaseNotes: manifestReleaseNotes, releaseNotesUrl: manifestReleaseNotesUrl } =
		await resolveReleaseNotes(
			{},
			normalizedReleaseNotesSchema(version).safeParse(releaseNotes).data,
			version,
		);

	const updateResult = await updateVersion({
		packageIdentifier,
		version,
		urls,
		releaseNotes: manifestReleaseNotes,
		releaseNotesUrl: manifestReleaseNotesUrl,
		replace: replace ? 'latest' : undefined,
		dryRun: process.env.DRY_RUN ? true : false,
		token: process.env.GITHUB_TOKEN!,
	});

	if (state) {
		await updateVersionState(packageIdentifier, state);
	}
	if (replace) {
		await closeAllButMostRecentPR(packageIdentifier);
	}

	logger.logUpdateResult(updateResult);

	return updateResult.changes;
}

async function handleJsonTask(fileName: string, logger: Logger) {
	const file = await fs.ref(`./${JSON_FOLDER}/${fileName}`).json();
	const task = JsonTaskSchema.parse(file);
	const packageIdentifier = fileName.replace('.json', '');
	let version: string;
	let urls: string[] = task.urls || [];
	let githubTag: string | undefined;

	switch (task.strategy) {
		case Strategy.GithubRelease: {
			const latest = await getLatestVersion({
				owner: task.github.owner,
				repo: task.github.repo,
				preRelease: task.github.preRelease,
				tagFilter: task.github.tagFilter,
				latest: task.github.fetchLatest,
			});
			githubTag = latest.tag;
			version = latest.version;
			if (task.github.fetchUrlsFromApi) {
				if (latest.urls.length === 0) {
					throw new Error('No URLs found in GitHub release');
				}
				urls = urls.concat(latest.urls);
			}
			break;
		}
		case Strategy.ElectronBuilder:
			version = await electronBuilder(task.electronBuilder.url);
			break;
		case Strategy.PageMatch:
			version = await pageMatch(task.pageMatch.url, new RegExp(task.pageMatch.regex, 'i'));
			break;
		case Strategy.SortVersions:
			version = await sortVersionsMatch(
				task.sortVersions.url,
				new RegExp(task.sortVersions.regex, 'i'),
			);
			break;
		case Strategy.Json: {
			const response = await ky(task.json.url).json();
			version = vs(getProperty(response, task.json.path));
			urls = urls.map((url) => {
				if (!isHttpUrl(url)) {
					return vs(getProperty(response, url));
				}
				return url;
			});
			break;
		}
		case Strategy.RedirectMatch: {
			const result = await redirectMatch(
				task.redirectMatch.url,
				new RegExp(task.redirectMatch.regex, 'i'),
			);
			version = result.version;
			if (!task.urls) {
				urls.push(result.url);
			}
			break;
		}
		case Strategy.SourceForge:
			version = await sourceforge(task.sourceforge.project, task.sourceforge.file);
			break;
		case Strategy.Yaml: {
			const response = await ky(task.yaml.url).text();
			// This is set to failsafe so incorrectly quoted values aren't parsed as numbers
			const yaml = parse(response, { schema: 'failsafe' });
			version = vs(getProperty(yaml, task.yaml.path));
			urls = urls.map((url) => {
				if (!isHttpUrl(url)) {
					return vs(getProperty(yaml, url));
				}
				return url;
			});
			break;
		}
	}

	version = version.startsWith('v') ? version.substring(1) : version;
	if (task.versionRemove) version = version.replaceAll(task.versionRemove, '');

	if (await checkVersionInRepo(version, packageIdentifier, logger)) return [];

	const releaseNotesTaskContext =
		task.strategy === Strategy.GithubRelease
			? { github: { owner: task.github.owner, repo: task.github.repo } }
			: {};

	const { releaseNotes, releaseNotesUrl } = await resolveReleaseNotes(
		releaseNotesTaskContext,
		normalizedReleaseNotesSchema(version).safeParse(task.releaseNotes).data,
		version,
		githubTag,
	);

	if (task.replace) {
		await closeAllButMostRecentPR(packageIdentifier);
	}
	urls = urls.map((url) => resolveVersionPlaceholders(url, version));

	logger.details(version, urls);

	const updateResult = await updateVersion({
		packageIdentifier,
		version,
		urls,
		replace: task.replace ? 'latest' : undefined,
		releaseNotes,
		releaseNotesUrl,
		dryRun: process.env.DRY_RUN ? true : false,
		token: process.env.GITHUB_TOKEN!,
	});

	logger.logUpdateResult(updateResult);

	return updateResult.changes;
}

async function executeTask(file: FileRef) {
	const logger = new Logger();

	logger.run(file.name);

	try {
		if (file.name.endsWith('ts')) {
			return {
				identifier: file.name,
				manifests: await handleScriptTask(file.name, logger),
			};
		} else {
			return {
				identifier: file.name,
				manifests: await handleJsonTask(file.name, logger),
			};
		}
	} catch (e) {
		logger.error(file.name, e as Error);
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
			if (result.status !== 'fulfilled' || result.value.manifests.length === 0) return [];
			return [result.value];
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
					`### ${task.identifier}`,
					'',
					'<details>',
					'<summary>Details</summary>',
					'',
				);

				for (const manifest of task.manifests) {
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
