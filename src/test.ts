const args = process.argv.slice(2);
const dryRunIndex = args.indexOf('--dry-run');

if (dryRunIndex !== -1) {
	process.env.DRY_RUN = 'true';
	args.splice(dryRunIndex, 1);
}

const shards = args.flatMap((arg) => arg.trim().split(' '));
if (shards.length === 0) {
	throw new Error('At least one package ID or "all" is required');
}

const { runAllShards } = await import('@/main');
const failureCount = await runAllShards(shards.includes('all') ? undefined : shards);

if (failureCount > 0) {
	process.exit(1);
}
