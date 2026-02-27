import fs from '@rcompat/fs';
import { z } from 'zod';

import { JsonTaskSchema } from '@/schema/json-task';

export async function generateJsonTaskSchema() {
	const schemaFile = new fs.FileRef('./src/schema/task/schema.json');
	await schemaFile.writeJSON(JSON.stringify(z.toJSONSchema(JsonTaskSchema), null, 2));
	console.log('Successfully generated JSON schema: src/schema/task/schema.json');
}

await generateJsonTaskSchema();
