import { bgRed, blue, green, redBright } from 'ansis';
import { updatePackage } from './komac.ts';

const pkg = Deno.args[0];

try {
	const task = await import(`../tasks/${pkg}.ts`);
	console.log(blue`Running task: ${pkg}\n`);
	const result = await task.default();

	if (result) {
		interface TaskResult {
			version: string;
			urls: string[];
			args?: string[];
		}

		const { version, urls, args = [] }: TaskResult = result;
		console.log(`Version: ${version}`);
		console.log(`URL(s): ${urls.join(' ')}\n`);
		console.log(await updatePackage(pkg, version, urls, ...args));
	}

	console.log(green`✅ Successfully completed task: ${pkg}`);
} catch (taskError) {
	const error = taskError as Error;
	console.error(
		bgRed`❌ Error in task ${pkg}:\n` + redBright`${error.message}`,
	);
}
