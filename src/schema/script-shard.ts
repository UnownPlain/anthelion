import { z } from 'zod';

import { releaseNotesSchema } from '@/schema/release-notes';

const urlArrayInputSchema = z.array(
	z
		.string()
		.nullish()
		.transform((url) => z.string().parse(url)),
);

export const urlsSchema = z
	.union([
		urlArrayInputSchema,
		z.custom<
			() => Array<string | null | undefined> | Promise<Array<string | null | undefined>> | undefined
		>((value) => typeof value === 'function', {
			message: 'Expected an array of URLs or a function returning URLs',
		}),
	])
	.transform((urls) =>
		typeof urls === 'function' ? async () => urlArrayInputSchema.parse(await urls()) : () => urls,
	);

export type Urls = z.output<typeof urlsSchema>;

const versionSchema = z
	.custom<() => string | undefined>((value) => typeof value === 'function', {
		message: 'Expected a function returning a version',
	})
	.transform((version) => () => z.string().parse(version()));

const versionInputSchema = z
	.string()
	.optional()
	.transform((version) => z.string().parse(version));

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
