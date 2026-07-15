import { z } from 'zod';

import { releaseNotesSchema } from '@/schema/release-notes';

const urlArrayInputSchema = z.array(z.unknown()).pipe(z.array(z.string()));

export const urlsSchema = z
	.union([
		urlArrayInputSchema,
		z.custom<() => unknown[] | Promise<unknown[]> | undefined>(
			(value) => typeof value === 'function',
			{
				message: 'Expected an array of URLs or a function returning URLs',
			},
		),
	])
	.transform((urls) =>
		typeof urls === 'function' ? async () => urlArrayInputSchema.parse(await urls()) : () => urls,
	);

export type Urls = z.output<typeof urlsSchema>;

const versionSchema = z
	.custom<() => unknown>((value) => typeof value === 'function', {
		message: 'Expected a function returning a version',
	})
	.transform((version) => () => z.string().parse(version()));

const versionInputSchema = z.unknown().transform((version) => z.string().parse(version));

const scriptShardCommonSchema = z.object({
	urls: urlsSchema,
	releaseNotes: releaseNotesSchema,
	replace: z.boolean().optional(),
	skipPrCheck: z.boolean().default(false),
	ignoreOtherPrs: z.boolean().default(false),
	installerMatches: z.string().array().optional(),
});

export const ScriptShardResult = z.union([
	scriptShardCommonSchema.extend({
		version: versionSchema,
		state: z.string().min(1),
	}),
	scriptShardCommonSchema.extend({
		version: versionInputSchema,
		state: z.undefined().optional(),
	}),
]);

export type ScriptShardResultInput = z.input<typeof ScriptShardResult>;
export type ScriptShard = () => ScriptShardResultInput | Promise<ScriptShardResultInput>;

export function defineShard<const T extends ScriptShard>(shard: T): T {
	return shard;
}
