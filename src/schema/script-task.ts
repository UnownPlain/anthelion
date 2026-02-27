import { z } from 'zod';

export const ScriptTaskResult = z.object({
	version: z.string(),
	urls: z.array(z.string()),
	releaseNotesUrl: z.string().optional(),
	replace: z.boolean().optional(),
	skipPrCheck: z.boolean().default(false),
	state: z.string().optional(),
});
