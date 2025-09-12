import { updatePackage } from '@/komac.ts';
import { checkVersionInRepo, Logger, readTasks, vs } from '@/helpers.ts';
import {
	ScriptTaskResult,
	JsonTaskSchema,
	Strategy,
} from '@/schema/task/schema';
import { Semaphore } from 'es-toolkit';
import type { DirEntry } from '@std/fs/unstable-types';
import { readFile } from '@std/fs/unstable-read-file';
import { getLatestPreReleaseVersion, getLatestVersion } from './github';
import { electronBuilder, pageMatch, redirectMatch } from './strategies';
import { getProperty } from 'dot-prop';
import ky from 'ky';

const SCRIPTS_FOLDER = 'tasks/script';
const JSON_FOLDER = 'tasks/json';
const semaphore = new Semaphore(16);
let failures = 0;

async function executeTask(entry: DirEntry) {
	await semaphore.acquire();
	const logger = new Logger();

	logger.run(entry.name);

	try {
		if (entry.name.endsWith('ts')) {
			const task = await import(`../${SCRIPTS_FOLDER}/${entry.name}`);
			const result = await task.default();
			const parsed = ScriptTaskResult.safeParse(result);
			const packageId = entry.name.replace('.ts', '');

			if (!parsed.success) {
				logger.log(result);
				logger.success(entry.name);
				return;
			}

			const { version, urls, args = [] } = parsed.data;

			if (await checkVersionInRepo(version, packageId)) {
				logger.present(version);
				logger.success(entry.name);
				return;
			}

			logger.log(`Version: ${version}`);
			logger.log(`URLs: ${urls.join(' ')}\n`);

			const updateResult = await updatePackage(
				packageId,
				version,
				urls,
				...args,
			);

			logger.log(updateResult);
		} else {
			const decoder = new TextDecoder();
			const file = await readFile(`./${JSON_FOLDER}/${entry.name}`);
			const task = JsonTaskSchema.parse(JSON.parse(decoder.decode(file)));
			let version: string;
			let urls: string[] = [];
			let args = task.args || [];

			switch (task.strategy) {
				case Strategy.GithubRelease:
					version = task.github.preRelease
						? await getLatestPreReleaseVersion(
								task.github.owner,
								task.github.repo,
							)
						: await getLatestVersion(task.github.owner, task.github.repo);
					break;
				case Strategy.ElectronBuilder:
					version = await electronBuilder(task.electronBuilder.url);
					break;
				case Strategy.PageMatch:
					version = await pageMatch(
						task.pageMatch.url,
						new RegExp(task.pageMatch.regex, 'i'),
					);
					break;
				case Strategy.Json:
					const response = await ky(task.json.url).json();
					version = vs(getProperty(response, task.json.path));
					break;
				case Strategy.RedirectMatch:
					const r = await redirectMatch(
						task.redirectMatch.url,
						new RegExp(task.redirectMatch.regex, 'i'),
					);
					version = r.version;
					urls.push(r.url);
					break;
			}

			if (await checkVersionInRepo(version, task.packageId)) {
				logger.present(version);
				logger.success(entry.name);
				return;
			}

			version = version.startsWith('v') ? version.substring(1) : version;
			if (task.versionRemove) version = version.replace(task.versionRemove, '');
			if (task.replace) args.push('-r');
			if (task.releaseNotes)
				args.push(
					'--release-notes-url',
					task.releaseNotes.replaceAll('{version}', version),
				);
			if (urls.length === 0 && task.urls?.length) {
				urls = task.urls.map((t) => t.replaceAll('{version}', version));
			}

			logger.log(`Version: ${version}`);
			logger.log(`URLs: ${urls.join(' ')}\n`);

			const updateResult = await updatePackage(
				task.packageId,
				version,
				urls,
				...args,
			);

			logger.log(updateResult);
		}

		logger.success(entry.name);
	} catch (e) {
		logger.error(entry.name, (e as Error).message);
		failures++;
	} finally {
		logger.log('─'.repeat(55));
		logger.flush();
		semaphore.release();
	}
}

async function runAllTasks() {
	const tasks = readTasks(SCRIPTS_FOLDER).concat(readTasks(JSON_FOLDER));

	console.log(`Found ${tasks.length} tasks to run\n`);

	await Promise.all(tasks.map(executeTask));

	console.log(
		`\nCompleted: ${tasks.length - failures}/${tasks.length} tasks successful`,
	);
}

await runAllTasks();
