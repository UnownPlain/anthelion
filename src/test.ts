import { bgRed, blue, green, redBright } from 'ansis';
import { updatePackage } from './komac.ts';
import z from 'zod';
import process from 'node:process';

const pkg = process.argv[2];

const TaskResultSchema = z.object({
	version: z.string(),
	urls: z.array(z.string()),
	args: z.array(z.string()).optional(),
});

type TaskResult = z.infer<typeof TaskResultSchema>;

console.log(blue`Running task: ${pkg}\n`);

try {
	const task = await import(`../tasks/${pkg}.ts`);
	const result = await task.default();

	if (TaskResultSchema.safeParse(result).success) {
		const { version, urls, args = [] }: TaskResult = result;
		console.log(`Version: ${version}`);
		console.log(`URL(s): ${urls.join(' ')}\n`);
		console.log(await updatePackage(pkg, version, urls, ...args));
	} else {
		console.log(result);
	}

	console.log(green`✅ Successfully completed task: ${pkg}`);
} catch (taskError) {
	const error = taskError as Error;
	console.error(
		bgRed`❌ Error in task ${pkg}:\n` + redBright`${error.message.trim()}`,
	);
}
