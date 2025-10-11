import { readdirSync } from 'node:fs';
import { basename } from 'node:path';
import { Logger, vs } from './helpers';
import { SCRIPTS_FOLDER, JSON_FOLDER, executeTask } from './main';

const task = vs(process.argv[2]);
const file = readdirSync(SCRIPTS_FOLDER, { withFileTypes: true })
	.concat(readdirSync(JSON_FOLDER, { withFileTypes: true }))
	.find((t) => basename(t.name).includes(basename(task)));

if (!file) {
	console.log(`Task ${task} not found`);
	process.exit(1);
}

try {
	await executeTask(file);
} catch (reason) {
	Logger.error(file.name, (reason as Error).message);
}
