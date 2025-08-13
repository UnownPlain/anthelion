import { updatePackage } from './komac.ts';
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

	let output = blue`Running task: ${entry.name}\n\n`;
	let success = true;

	try {
		const task = await import(`../tasks/${entry.name}`);
		const result = await task.default();
		const parsed = TaskResult.safeParse(result);
		const packageId = entry.name.replace('.ts', '');

		if (!parsed.success) {
			output += `${result}\n`;
			return success;
		}

		const { version, urls, args = [] } = parsed.data;
		const versionCheck = await ky(
			`${MANIFEST_URL}/${packageId[0].toLowerCase()}/${packageId.split('.').join('/')}/${version}/${packageId}.yaml`,
			{
				throwHttpErrors: false,
			},
		);

		if (versionCheck.ok) {
			output += `Version ${version} is already present in winget-pkgs.\n\n`;
			return success;
		}

		output += `Version: ${version}\n`;
		output += `URLs: ${urls.join(' ')}\n\n`;

		const updateResult = await updatePackage(packageId, version, urls, ...args);
		output += `${updateResult}\n`;
		return success;
	} catch (error) {
		output += bgRed`❌ Error in ${entry.name}:\n`;
		output += redBright`${(error as Error).message}\n`;
		success = false;
		return success;
	} finally {
		if (success) output += green`✅ Successfully completed: ${entry.name}`;
		console.log(output);
		console.log('─'.repeat(55));
		semaphore.release();
	}
}

async function runAllTasks() {
	const tasks = Array.from(readDirSync('./tasks')).filter(
		(entry) => entry.isFile && entry.name.endsWith('.ts'),
	);

	console.log(`Found ${tasks.length} tasks to run\n`);

	const results = await Promise.all(tasks.map(executeTask));
	const successful = results.filter(Boolean).length;

	console.log(`\nCompleted: ${successful}/${tasks.length} tasks successful`);
}

await runAllTasks();
