import fs, { type FileRef } from '@rcompat/fs';

import { vs } from '@/helpers';
import { JSON_FOLDER, SCRIPTS_FOLDER, executeTask } from '@/main';

const task = vs(process.argv[2]);

const scripts = await fs.ref(SCRIPTS_FOLDER).list();
const json = await fs.ref(JSON_FOLDER).list();
const files: FileRef[] = scripts.concat(json);

const file = files.find((t: FileRef) => t.name === task || t.base === task);

if (!file) {
	console.log(`Task ${task} not found`);
	process.exit(1);
}

if (process.argv[3] === '--dry-run') {
	process.env.DRY_RUN = 'true';
}

await executeTask(file);
