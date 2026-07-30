import { z } from 'zod';

import { releaseNotesSchema } from '@/schema/release-notes';

const installerSourceSchema = z.union([
	z.string(),
	z.object({
		url: z.string(),
		architecture: z.enum(['x86', 'x64', 'arm', 'arm64', 'neutral']).optional(),
		nestedInstallerMatches: z.array(z.string().min(1)).min(1).optional(),
	}),
]);

const urlArrayInputSchema = z.array(z.unknown()).pipe(z.array(installerSourceSchema));

export const urlsSchema = z
	.function({
		input: [],
		output: z.unknown(),
	})
	.transform((urls) => async () => urlArrayInputSchema.parse(await urls()));

export type Urls = z.output<typeof urlsSchema>;

const versionInputSchema = z.unknown().pipe(
	z.union([
		z.string(),
		z.object({
			source: z.enum(['display', 'product', 'file', 'fontVersion']),
		}),
	]),
);

const scriptShardCommonSchema = z.object({
	urls: urlsSchema,
	releaseNotes: releaseNotesSchema,
	replace: z.boolean().optional(),
	skipPrCheck: z.boolean().default(false),
	ignoreOtherPrs: z.boolean().default(false),
});

export const ScriptShardResult = scriptShardCommonSchema.extend({
	version: versionInputSchema,
	state: z.unknown().pipe(z.string().min(1)).optional(),
});

export type ScriptShardResultInput = z.input<typeof ScriptShardResult>;
export type ScriptShard = () => Promise<ScriptShardResultInput>;

type Exact<Actual, Expected> = Actual extends Expected
	? Actual & Record<Exclude<keyof Actual, keyof Expected>, never>
	: never;

export function defineShard<const Result extends ScriptShardResultInput>(
	shard: () => Promise<Exact<Result, ScriptShardResultInput>>,
): typeof shard {
	return shard;
}
