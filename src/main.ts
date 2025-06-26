import { updatePackage } from './komac.ts';
import { Semaphore } from '@es-toolkit/es-toolkit';
import { bgRed, blue, green, redBright } from 'ansis';
import z from 'zod/v4';

const TaskResult = z.object({
	version: z.string(),
	urls: z.array(z.string()),
	args: z.array(z.string()).optional(),
});

const semaphore = new Semaphore(16);

async function executeTask(entry: Deno.DirEntry) {
	await semaphore.acquire();

	let output = blue`Running task: ${entry.name}\n\n`;

	try {
		const task = await import(`../tasks/${entry.name}`);
		const result = await task.default();
		const parsed = TaskResult.safeParse(result);

		if (parsed.success) {
			const { version, urls, args = [] } = parsed.data;
			output += `Version: ${version}\n`;
			output += `URLs: ${urls.join(' ')}\n\n`;

			const updateResult = await updatePackage(
				entry.name.replace('.ts', ''),
				version,
				urls,
				...args,
			);
			output += `${updateResult}\n`;
		} else {
			output += `${result}\n`;
		}

		output += green`✅ Successfully completed: ${entry.name}`;
		return true;
	} catch (error) {
		output += bgRed`❌ Error in ${entry.name}:\n`;
		output += redBright`${(error as Error).message}\n`;
		return false;
	} finally {
		console.log(output);
		console.log('─'.repeat(55));
		semaphore.release();
	}
}

async function runAllTasks() {
	const tasks = Array.from(Deno.readDirSync('./tasks')).filter(
		(entry) => entry.isFile && entry.name.endsWith('.ts'),
	);

	console.log(`Found ${tasks.length} tasks to run\n`);

	const results = await Promise.all(tasks.map(executeTask));
	const successful = results.filter(Boolean).length;

	console.log(`\nCompleted: ${successful}/${tasks.length} tasks successful`);
}

await runAllTasks();
