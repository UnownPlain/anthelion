import { vs } from './helpers';
import { runAllTasks } from './main';

const tasks = vs(process.argv[2]).split(' ');

if (process.argv[3] === '--dry-run') {
	process.env.DRY_RUN = 'true';
}

await runAllTasks(tasks);
