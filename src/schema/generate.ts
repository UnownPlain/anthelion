import fs from '@rcompat/fs';
import { z } from 'zod';

import { JsonShardSchema } from '@/schema/json-shard';

export async function generateJsonShardSchema() {
	const schemaFile = fs.ref('./src/schema/schema.json');
	await schemaFile.write(JSON.stringify(z.toJSONSchema(JsonShardSchema), null, 2));
	console.log('Successfully generated JSON schema: src/schema/schema.json');
}

await generateJsonShardSchema();
