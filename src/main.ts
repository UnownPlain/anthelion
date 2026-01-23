import fs, { type FileRef } from '@rcompat/fs';
import ansis from 'ansis';
import { getProperty } from 'dot-prop';
import { limitAsync } from 'es-toolkit';
import ky from 'ky';
import { parse } from 'yaml';

import { getLatestVersion } from '@/github';
import { closeAllButMostRecentPR, Logger, vs } from '@/helpers';
import { updatePackage } from '@/komac';
import { JsonTaskSchema, ScriptTaskResult, Strategy } from '@/schema/task/schema';
import { electronBuilder, pageMatch, redirectMatch } from '@/strategies';

const MAX_CONCURRENCY = 32;
export const SCRIPTS_FOLDER = 'tasks/script';
export const JSON_FOLDER = 'tasks/json';
const MANIFEST_URL =
	'https://raw.githubusercontent.com/microsoft/winget-pkgs/refs/heads/master/manifests';

async function checkVersionInRepo(version: string, packageId: string, logger: Logger) {
	const manifestPath = `${MANIFEST_URL}/${packageId.charAt(0).toLowerCase()}/${packageId
		.split('.')
		.join('/')}/${version}/${packageId}.yaml`;

	const versionCheck = await ky(manifestPath, {
		throwHttpErrors: false,
	});
	const check = versionCheck.ok && import.meta.main;

	if (check) logger.present(version);

	return check;
}

async function handleScriptTask(fileName: string, logger: Logger) {
	const task = await import(`../${SCRIPTS_FOLDER}/${fileName}`);
	const result = await task.default();
	const parsed = ScriptTaskResult.safeParse(result);
	const packageId = fileName.replace('.ts', '');

	if (!parsed.success) {
		logger.log(result);
		return;
	}

	const { version, urls, args = [] } = parsed.data;

	if (await checkVersionInRepo(version, packageId, logger)) return;

	logger.details(version, urls);

	const updateResult = await updatePackage(packageId, version, urls, ...args);

	logger.log(updateResult);
}

async function handleJsonTask(fileName: string, logger: Logger) {
	const file = await new fs.FileRef(`./${JSON_FOLDER}/${fileName}`).json();
	const task = JsonTaskSchema.parse(file);
	let version: string;
	let urls: string[] = task.urls || [];
	let args = task.args || [];

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
			if (task.releaseNotes && !task.releaseNotes.startsWith('https://')) {
				task.releaseNotes = vs(getProperty(response, task.releaseNotes));
			}
			break;
		}
		case Strategy.RedirectMatch: {
			const r = await redirectMatch(
				task.redirectMatch.url,
				new RegExp(task.redirectMatch.regex, 'i'),
			);
			version = r.version;
			if (!task.urls) {
				urls.push(r.url);
			}
			break;
		}
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
			if (task.releaseNotes && !task.releaseNotes.startsWith('https://')) {
				task.releaseNotes = vs(getProperty(response, task.releaseNotes));
			}
			break;
		}
	}

	version = version.startsWith('v') ? version.substring(1) : version;
	if (task.versionRemove) version = version.replace(task.versionRemove, '');

	if (await checkVersionInRepo(version, task.packageId, logger)) return;

	if (task.replace) {
		args.push('-r');
		await closeAllButMostRecentPR(task.packageId);
	}
	if (task.releaseNotes)
		args.push('--release-notes-url', task.releaseNotes.replaceAll('{version}', version));
	urls = urls.map((t) => t.replaceAll('{version}', version));

	logger.details(version, urls);

	const updateResult = await updatePackage(task.packageId, version, urls, ...args);

	logger.log(updateResult + '\n');
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
	let errorSummary = '';

	const failures = results
		.map((result, i) => ({ result, file: tasks[i] }))
		.filter(
			(x): x is { result: PromiseRejectedResult; file: FileRef } => x.result.status === 'rejected',
		)
		.map((r) => {
			errorSummary += `### ❌ Error in ${r.file.name}\n\`\`\`\n${ansis.strip(r.result.reason.message)}\n\`\`\`\n`;
		});

	const completed = `✅ Run completed: ${tasks.length - failures.length}/${tasks.length} tasks successful`;

	if (process.env.GITHUB_STEP_SUMMARY) {
		let summary = `# Summary\n\n${completed}`;
		if (errorSummary) {
			summary += `\n\n## Run Errors\n\n${errorSummary}`;
		}
		await new fs.FileRef(process.env.GITHUB_STEP_SUMMARY).write(summary);
	}

	console.log(`\n${completed}`);
}

if (import.meta.main) {
	await runAllTasks();
}
