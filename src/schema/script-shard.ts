import { z } from 'zod';

import { releaseNotesSchema } from '@/schema/release-notes';

export type Urls = () => string[] | Promise<string[]>;
export type Version = () => string;

export const urlsSchema = z
	.union([
		z.array(z.string()),
		z.custom<Urls>((value) => typeof value === 'function', {
			message: 'Expected an array of URLs or a function returning URLs',
		}),
	])
	.transform((urls): Urls => (typeof urls === 'function' ? urls : () => urls));

const versionSchema = z.custom<Version>((value) => typeof value === 'function', {
	message: 'Expected a function returning a version',
});

const scriptShardCommonSchema = z.object({
	urls: urlsSchema,
	releaseNotes: releaseNotesSchema,
	replace: z.boolean().optional(),
	skipPrCheck: z.boolean().default(false),
	installerMatches: z.string().array().optional(),
});

export const ScriptShardResult = z.union([
	scriptShardCommonSchema.extend({
		version: versionSchema,
		state: z.string().min(1),
	}),
	scriptShardCommonSchema.extend({
		version: z.string(),
		state: z.undefined().optional(),
	}),
]);
