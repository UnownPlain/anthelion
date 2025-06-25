import { updatePackage } from './komac.ts';
import { Semaphore } from '@es-toolkit/es-toolkit';
import { bgRed, blue, green, redBright } from 'ansis';
import z from 'zod/v4';

const TaskResultSchema = z.object({
	version: z.string(),
	urls: z.array(z.string()),
	args: z.array(z.string()).optional(),
});

type TaskResult = z.infer<typeof TaskResultSchema>;

const sema = new Semaphore(16);

async function executeTask(entry: Deno.DirEntry) {
	await sema.acquire();

	let output = blue`Running task: ${entry.name}\n\n`;

	try {
		const task = await import(`../tasks/${entry.name}`);
		const result = await task.default();

		if (TaskResultSchema.safeParse(result).success) {
			const { version, urls, args = [] }: TaskResult = result;

			output += `Version: ${version}\n`;
			output += `URL(s): ${urls.join(' ')}\n\n`;

			const packageName = entry.name.replace('.ts', '');
			const updateResult = await updatePackage(
				packageName,
				version,
				urls,
				...args,
			);

			output += `${updateResult}\n`;
		} else {
			output += `${result}\n`;
		}

		output += green`✅ Successfully completed task: ${entry.name}`;
		return true;
	} catch (error) {
		const taskError = error as Error;
		output += bgRed`❌ Error in task ${entry.name}:\n`;
		output += redBright`${taskError.message}\n`;
		return false;
	} finally {
		console.log(output);
		console.log('─'.repeat(55));
		sema.release();
	}
}

async function runAllTasks() {
	const taskEntries = Deno.readDirSync('./tasks')
		.toArray()
		.filter((entry) => entry.isFile && entry.name.endsWith('.ts'))
		.map(executeTask);

	console.log(`Found ${taskEntries.length} tasks to run\n`);

	const results = await Promise.all(taskEntries);
	const successfulCount = results.filter((success) => success).length;

	console.log(
		`\nCompleted: ${successfulCount}/${taskEntries.length} tasks successful`,
	);
}

await runAllTasks();
