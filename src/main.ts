import { updatePackage } from '@/komac.ts';
import { Logger } from '@/helpers.ts';
import { Semaphore } from 'es-toolkit';
import { bgRed, blue, green, redBright } from 'ansis';
import { readDirSync } from '@std/fs/unstable-read-dir';
import type { DirEntry } from '@std/fs/unstable-types';
import z from 'zod';
import ky from 'ky';

const MANIFEST_URL =
	'https://raw.githubusercontent.com/microsoft/winget-pkgs/refs/heads/master/manifests/';

const TaskResult = z.object({
	version: z.string(),
	urls: z.array(z.string()),
	args: z.array(z.string()).optional(),
});

const semaphore = new Semaphore(16);

async function executeTask(entry: DirEntry) {
	await semaphore.acquire();
	const logger = new Logger();

	logger.log(blue`Running task: ${entry.name}\n`);
	let success = true;

	try {
		const task = await import(`../tasks/script/${entry.name}`);
		const result = await task.default();
		const parsed = TaskResult.safeParse(result);
		const packageId = entry.name.replace('.ts', '');

		if (!parsed.success) {
			logger.log(result);
			return success;
		}

		const { version, urls, args = [] } = parsed.data;

		const manifestPath = `${MANIFEST_URL}/${packageId.charAt(0).toLowerCase()}/${packageId
			.split('.')
			.join('/')}/${version}/${packageId}.yaml`;

		const versionCheck = await ky(manifestPath, {
			throwHttpErrors: false,
		});

		if (versionCheck.ok) {
			logger.log(`Version ${version} is already present in winget-pkgs.\n`);
			return success;
		}

		logger.log(`Version: ${version}`);
		logger.log(`URLs: ${urls.join(' ')}\n`);

		const updateResult = await updatePackage(packageId, version, urls, ...args);
		logger.log(`${updateResult}`);
		return success;
	} catch (error) {
		logger.log(bgRed`❌ Error in ${entry.name}:`);
		logger.log(redBright`${(error as Error).message}`);
		success = false;
		return success;
	} finally {
		if (success) logger.log(green`✅ Successfully completed: ${entry.name}`);
		logger.log('─'.repeat(55));
		logger.flush();
		semaphore.release();
	}
}

async function runAllTasks() {
	const tasks = Array.from(readDirSync('./tasks/script')).filter(
		(entry) => entry.isFile && entry.name.endsWith('.ts'),
	);

	console.log(`Found ${tasks.length} tasks to run\n`);

	const results = await Promise.all(tasks.map(executeTask));
	const successful = results.filter(Boolean).length;

	console.log(`\nCompleted: ${successful}/${tasks.length} tasks successful`);
}

await runAllTasks();
