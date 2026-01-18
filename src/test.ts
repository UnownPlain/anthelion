import { vs } from '@/helpers';
import { JSON_FOLDER, SCRIPTS_FOLDER, executeTask } from '@/main';
import fs from '@rcompat/fs';

const task = vs(process.argv[2]);

const scripts = await new fs.FileRef(SCRIPTS_FOLDER).list();
const json = await new fs.FileRef(JSON_FOLDER).list();
const files = scripts.concat(json);

const file = files.find((t) => t.name === task || t.base === task);

if (!file) {
	console.log(`Task ${task} not found`);
	process.exit(1);
}

if (process.argv[3] === '--dry-run') {
	process.env.DRY_RUN = 'true';
}

await executeTask(file);
