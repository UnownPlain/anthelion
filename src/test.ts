import { vs } from '@/helpers';
import { runAllShards } from '@/main';

const args = process.argv.slice(2);
const dryRunIndex = args.indexOf('--dry-run');

if (dryRunIndex !== -1) {
	process.env.DRY_RUN = 'true';
	args.splice(dryRunIndex, 1);
}

const shards = args.flatMap((arg) => vs(arg).split(' '));
if (shards.length === 0) {
	throw new Error('At least one package ID or "all" is required');
}

const failureCount = await runAllShards(shards.includes('all') ? undefined : shards);

if (failureCount > 0) {
	process.exit(1);
}
