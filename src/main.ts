import { bgRed, blue, green, redBright } from 'ansis';
import { updatePackage } from './komac.ts';

interface TaskResult {
	version: string;
	urls: string[];
	args?: string[];
}

const CONCURRENT_TASKS = 16;

async function processTask(entry: Deno.DirEntry) {
	let output = blue`Running task: ${entry.name}\n\n`;

	try {
		const task = await import(`../tasks/${entry.name}`);
		const result = await task.default();

		if (result) {
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
			output += updateResult + '\n';
		}

		output += green`✅ Successfully completed task: ${entry.name}`;
		return { success: true, name: entry.name, output };
	} catch (error) {
		const taskErorr = error as Error;
		output += bgRed`❌ Error in task ${entry.name}:\n`;
		output += redBright`${taskErorr.message}\n`;
		return { success: false, name: entry.name, output };
	}
}

async function runTasksConcurrently(
	tasks: Deno.DirEntry[],
	maxConcurrency: number,
) {
	const results = [];

	for (let i = 0; i < tasks.length; i += maxConcurrency) {
		const batch = tasks.slice(i, i + maxConcurrency);
		const batchResults = await Promise.all(batch.map(processTask));

		results.push(...batchResults);

		batchResults.forEach((result) => {
			console.log(result.output);
			console.log('-'.repeat(55));
		});
	}

	return results;
}

async function runAllTasks() {
	const taskEntries = Array.from(Deno.readDirSync('./tasks')).filter(
		(entry) => entry.isFile && entry.name.endsWith('.ts'),
	);

	console.log(`Found ${taskEntries.length} tasks to run\n`);

	const results = await runTasksConcurrently(taskEntries, CONCURRENT_TASKS);
	const successful = results.filter((r) => r.success).length;

	console.log(`\nCompleted: ${successful}/${results.length} tasks successful`);
}

await runAllTasks();
