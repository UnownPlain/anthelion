import { readdirSync } from 'node:fs';
import { basename } from 'node:path';
import { vs } from '@/helpers';
import { JSON_FOLDER, SCRIPTS_FOLDER, executeTask } from '@/main';

const task = vs(process.argv[2]);
const files = readdirSync(SCRIPTS_FOLDER, { withFileTypes: true }).concat(
	readdirSync(JSON_FOLDER, { withFileTypes: true }),
);

const file =
	files.find((t) => basename(t.name) === basename(task)) ||
	files.find((t) => t.name === `${task}.ts` || t.name === `${task}.json`);

if (!file) {
	console.log(`Task ${task} not found`);
	process.exit(1);
}

await executeTask(file);
