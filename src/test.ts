import { vs } from '@/helpers';
import { runAllShards } from '@/main';

const shards = vs(process.argv[2]).split(' ');

if (process.argv[3] === '--dry-run') {
	process.env.DRY_RUN = 'true';
}

const failureCount = await runAllShards(shards[0] === 'all' ? undefined : shards);

if (failureCount > 0) {
	process.exit(1);
}
