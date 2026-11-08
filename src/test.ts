import { config } from '@/config';

const args = process.argv.slice(2);
const dryRunIndex = args.indexOf('--dry-run');

if (dryRunIndex !== -1) {
	config.dryRun = true;
	args.splice(dryRunIndex, 1);
}

const shards = args.flatMap((arg) => arg.trim().split(' '));
if (shards.length === 0) {
	throw new Error('At least one package ID or "all" is required');
}

if (config.dryRun && shards.includes('all')) {
	config.concurrency = Math.min(config.concurrency, config.dryRunConcurrency);
}

const { runAllShards } = await import('@/main');
const failureCount = await runAllShards(shards.includes('all') ? undefined : shards);

if (failureCount > 0) {
	process.exit(1);
}
