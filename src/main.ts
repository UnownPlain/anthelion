import { bgRed, blue, green, redBright } from 'ansis';
import { updatePackage } from './komac.ts';

async function runAllTasks() {
	const taskEntries = Deno.readDirSync('./tasks')
		.toArray()
		.filter((entry) => {
			return entry.isFile && entry.name.endsWith('.ts');
		});

	console.log(`Found ${taskEntries.length} tasks to run`);

	for (const entry of taskEntries) {
		console.log(blue`Running task: ${entry.name}\n`);

		try {
			const task = await import(`../tasks/${entry.name}`);
			const result = await task.default();

			if (result) {
				interface TaskResult {
					packageId: string;
					version: string;
					urls: string[];
					args?: string[];
				}

				const { packageId, version, urls, args = [] }: TaskResult = result;
				await updatePackage(packageId, version, urls, ...args);
			}

			console.log(green`✅ Successfully completed task: ${entry.name}`);
		} catch (taskError) {
			const error = taskError as Error;
			console.error(
				bgRed`❌ Error in task ${entry.name}:\n` + redBright`${error.message}`,
			);
		}

		console.log('-'.repeat(55));
	}

	console.log('All tasks execution attempts completed!');
}

await runAllTasks();
