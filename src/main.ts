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
	vs,
	checkVersionInRepo,
	isStateMatching,
	updateVersionState,
} from '@/helpers';
import { JsonTaskSchema, ScriptTaskResult, Strategy } from '@/schema/task/schema';
import { electronBuilder, pageMatch, redirectMatch, sourceforge } from '@/strategies';

const MAX_CONCURRENCY = 32;
export const SCRIPTS_FOLDER = 'tasks/script';
export const JSON_FOLDER = 'tasks/json';

async function handleScriptTask(fileName: string, logger: Logger) {
	const task = await import(`../${SCRIPTS_FOLDER}/${fileName}`);
	const { version, urls, releaseNotesUrl, replace, skipPrCheck, state } = ScriptTaskResult.parse(
		await task.default(),
	);
	const packageIdentifier = fileName.replace('.ts', '');

	if (!skipPrCheck && (await checkVersionInRepo(version, packageIdentifier, logger))) return;

	if (state && (await isStateMatching(packageIdentifier, state))) {
		logger.stateMatches(version);
		return;
	}

	logger.details(version, urls);

	const updateResult = await updateVersion({
		packageIdentifier,
		version,
		urls,
		releaseNotesUrl,
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
}

async function handleJsonTask(fileName: string, logger: Logger) {
	const file = await new fs.FileRef(`./${JSON_FOLDER}/${fileName}`).json();
	const task = JsonTaskSchema.parse(file);
	const packageIdentifier = fileName.replace('.json', '');
	let version: string;
	let urls: string[] = task.urls || [];

	switch (task.strategy) {
		case Strategy.GithubRelease: {
			const latest = await getLatestVersion({
				owner: task.github.owner,
				repo: task.github.repo,
				preRelease: task.github.preRelease,
				tagFilter: task.github.tagFilter,
				latest: task.github.fetchLatest,
			});
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
		case Strategy.Json: {
			const response = await ky(task.json.url).json();
			version = vs(getProperty(response, task.json.path));
			urls = urls.map((url) => {
				if (!url.startsWith('https://')) {
					return vs(getProperty(response, url));
				}
				return url;
			});
			if (task.releaseNotesUrl && !task.releaseNotesUrl.startsWith('https://')) {
				task.releaseNotesUrl = vs(getProperty(response, task.releaseNotesUrl));
			}
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
				if (!url.startsWith('https://')) {
					return vs(getProperty(response, url));
				}
				return url;
			});
			if (task.releaseNotesUrl && !task.releaseNotesUrl.startsWith('https://')) {
				task.releaseNotesUrl = vs(getProperty(response, task.releaseNotesUrl));
			}
			break;
		}
	}

	version = version.startsWith('v') ? version.substring(1) : version;
	if (task.versionRemove) version = version.replaceAll(task.versionRemove, '');

	if (await checkVersionInRepo(version, packageIdentifier, logger)) return;

	if (task.replace) {
		await closeAllButMostRecentPR(packageIdentifier);
	}
	task.releaseNotesUrl = task.releaseNotesUrl?.replaceAll('{version}', version);
	urls = urls.map((url) => url.replaceAll('{version}', version));

	logger.details(version, urls);

	const updateResult = await updateVersion({
		packageIdentifier,
		version,
		urls,
		replace: task.replace ? 'latest' : undefined,
		releaseNotesUrl: task.releaseNotesUrl,
		dryRun: process.env.DRY_RUN ? true : false,
		token: process.env.GITHUB_TOKEN!,
	});

	logger.logUpdateResult(updateResult);
}

export async function executeTask(file: FileRef) {
	const logger = new Logger();

	logger.run(file.name);

	try {
		if (file.name.endsWith('ts')) {
			await handleScriptTask(file.name, logger);
		} else {
			await handleJsonTask(file.name, logger);
		}
	} catch (e) {
		logger.error(file.name, e as Error);
		throw e;
	} finally {
		logger.flush();
	}
}

async function runAllTasks() {
	const scripts = await new fs.FileRef(SCRIPTS_FOLDER).list();
	const json = await new fs.FileRef(JSON_FOLDER).list();
	const tasks = scripts.concat(json);

	console.log(`Found ${tasks.length} tasks to run\n`);

	const results = await Promise.allSettled(tasks.map(limitAsync(executeTask, MAX_CONCURRENCY)));

	const failures = results
		.map((result, i) => ({ result, file: tasks[i] }))
		.filter(
			(x): x is { result: PromiseRejectedResult; file: FileRef } => x.result.status === 'rejected',
		);

	const errorSummary = failures
		.map(
			(r) =>
				`### ❌ Error in ${r.file.name}\n\`\`\`\n${ansis.strip(r.result.reason.message)}\n\`\`\`\n`,
		)
		.join('');

	const completed = `✅ Run completed: ${tasks.length - failures.length}/${tasks.length} tasks successful`;

	if (process.env.GITHUB_STEP_SUMMARY) {
		let summary = `# Summary\n\n${completed}`;
		if (errorSummary) {
			summary += `\n\n## Run Errors\n\n${errorSummary}`;
		}
		await new fs.FileRef(process.env.GITHUB_STEP_SUMMARY).write(summary);
	}

	console.log(completed);
}

if (import.meta.main) {
	await runAllTasks();
}
