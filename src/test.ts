import { bgRed, blue, green, redBright } from 'ansis';

const pkg = Deno.args[0];

try {
	const taskModule = await import(`../tasks/${pkg}.ts`);
	console.log(blue`Running task: ${pkg}\n`);
	await taskModule.default();

	console.log(green`✅ Successfully completed task: ${pkg}`);
} catch (taskError) {
	const errorMessage = taskError instanceof Error
		? taskError.message
		: String(taskError);
	console.error(bgRed`❌ Error in task ${pkg}:\n`, redBright`${errorMessage}`);
}
