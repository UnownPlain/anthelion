import { z } from 'zod';

import { releaseNotesSchema } from '@/schema/release-notes';

export const ScriptTaskResult = z.object({
	version: z.string(),
	urls: z.array(z.string()),
	releaseNotes: releaseNotesSchema,
	replace: z.boolean().optional(),
	skipPrCheck: z.boolean().default(false),
	state: z.string().optional(),
});
