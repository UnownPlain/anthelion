import {
	ScriptTaskResult,
	JsonTaskSchema,
	Strategy,
} from '@/schema/task/schema';
import { updatePackage } from '@/komac.ts';
import { Logger, vs } from '@/helpers.ts';
import { getLatestPreReleaseVersion, getLatestVersion } from '@/github';
import { electronBuilder, pageMatch, redirectMatch } from '@/strategies';
import { Semaphore } from 'es-toolkit';
import { getProperty } from 'dot-prop';
import { readdirSync, type Dirent } from 'node:fs';
import ky from 'ky';

export const SCRIPTS_FOLDER = 'tasks/script';
export const JSON_FOLDER = 'tasks/json';
const MANIFEST_URL =
	'https://raw.githubusercontent.com/microsoft/winget-pkgs/refs/heads/master/manifests/';
const semaphore = new Semaphore(32);

export async function executeTask(file: Dirent) {
	await semaphore.acquire();
	const logger = new Logger();

	logger.run(file.name);

	async function checkVersionInRepo(version: string, packageId: string) {
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

	async function handleScriptTask(fileName: string) {
		const task = await import(`../${SCRIPTS_FOLDER}/${fileName}`);
		const result = await task.default();
		const parsed = ScriptTaskResult.safeParse(result);
		const packageId = fileName.replace('.ts', '');

		if (!parsed.success) {
			logger.log(result);
			return;
		}

		const { version, urls, args = [] } = parsed.data;

		if (await checkVersionInRepo(version, packageId)) return;

		logger.details(version, urls);

		const updateResult = await updatePackage(packageId, version, urls, ...args);

		logger.log(updateResult);
	}

	async function handleJsonTask(fileName: string) {
		const file = Bun.file(`./${JSON_FOLDER}/${fileName}`);
		const task = JsonTaskSchema.parse(await file.json());
		let version: string;
		let urls: string[] = task.urls || [];
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
		}

		if (await checkVersionInRepo(version, task.packageId)) return;

		version = version.startsWith('v') ? version.substring(1) : version;
		if (task.versionRemove) version = version.replace(task.versionRemove, '');
		if (task.replace) args.push('-r');
		if (task.releaseNotes)
			args.push(
				'--release-notes-url',
				task.releaseNotes.replaceAll('{version}', version),
			);
		urls = urls.map((t) => t.replaceAll('{version}', version));

		logger.details(version, urls);

		const updateResult = await updatePackage(
			task.packageId,
			version,
			urls,
			...args,
		);

		logger.log(updateResult);
	}

	if (file.name.endsWith('ts')) {
		await handleScriptTask(file.name);
	} else {
		await handleJsonTask(file.name);
	}

	logger.log('─'.repeat(55));
	logger.flush();
	semaphore.release();
}

async function runAllTasks() {
	const tasks = readdirSync(SCRIPTS_FOLDER, { withFileTypes: true }).concat(
		readdirSync(JSON_FOLDER, { withFileTypes: true }),
	);

	console.log(`Found ${tasks.length} tasks to run\n`);

	const results = await Promise.allSettled(tasks.map(executeTask));

	const failures = results
		.map((result, i) => ({ result, file: tasks[i] }))
		.filter(
			(x): x is { result: PromiseRejectedResult; file: Dirent } =>
				x.result.status === 'rejected',
		)
		.map((r) => Logger.error(r.file.name, `${r.result.reason.message}\n`));

	console.log(
		`\nCompleted: ${tasks.length - failures.length}/${tasks.length} tasks successful`,
	);
}

if (import.meta.main) {
	await runAllTasks();
}
