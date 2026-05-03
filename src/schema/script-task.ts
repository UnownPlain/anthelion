import { z } from 'zod';

import { releaseNotesSchema } from '@/schema/release-notes';

export type Urls = () => string[];

export const urlsSchema = z
	.union([
		z.array(z.string()),
		z.custom<Urls>((value) => typeof value === 'function', {
			message: 'Expected an array of URLs or a function returning URLs',
		}),
	])
	.transform((urls): Urls => (typeof urls === 'function' ? urls : () => urls));

export const ScriptTaskResult = z.object({
	version: z.string(),
	urls: urlsSchema,
	releaseNotes: releaseNotesSchema,
	replace: z.boolean().optional(),
	skipPrCheck: z.boolean().default(false),
	state: z.string().optional(),
});
