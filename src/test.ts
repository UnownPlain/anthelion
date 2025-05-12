import { bgRed, blue, green, redBright } from 'ansis';

const pkg = Deno.args[0];

try {
	const task = await import(`../tasks/${pkg}.ts`);
	console.log(blue`Running task: ${pkg}\n`);
	await task.default();

	console.log(green`✅ Successfully completed task: ${pkg}`);
} catch (taskError) {
	console.error(
		bgRed`❌ Error in task ${pkg}:\n`,
		redBright`${taskError as Error}`,
	);
}
