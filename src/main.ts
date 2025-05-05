import { bgRed, blue, green, redBright } from 'ansis';

async function runAllTasks() {
	const taskEntries = Deno.readDirSync('./tasks').toArray();

	console.log(`Found ${taskEntries.length} tasks to run`);

	for (const entry of taskEntries) {
		if (!entry.isFile || !entry.name.endsWith('.ts')) {
			continue;
		}

		console.log(blue`Running task: ${entry.name}\n`);

		try {
			const taskModule = await import(`../tasks/${entry.name}`);
			await taskModule.default();

			console.log(green`✅ Successfully completed task: ${entry.name}`);
		} catch (taskError) {
			const errorMessage = taskError instanceof Error
				? taskError.message
				: String(taskError);
			console.error(
				bgRed`❌ Error in task ${entry.name}:\n`,
				redBright`${errorMessage}`,
			);
		}

		console.log('-'.repeat(55));
	}

	console.log('All tasks execution attempts completed!');
}

await runAllTasks();
