import { z } from 'zod';

import { releaseNotesSchema } from '@/schema/release-notes';

type UrlsReturnInput =
	| unknown[]
	| {
			url: unknown;
			architecture?: unknown;
			nestedInstallerMatches?: unknown;
	  };

const urlArrayInputSchema = z.array(
	z.union([
		z.string(),
		z.object({
			url: z.string(),
			architecture: z.enum(['x86', 'x64', 'arm', 'arm64', 'neutral']).optional(),
			nestedInstallerMatches: z.array(z.string().min(1)).min(1).optional(),
		}),
	]),
);

export const urlsSchema = z
	.function({
		input: [],
		output: z.custom<UrlsReturnInput | PromiseLike<UrlsReturnInput>>(
			(value) =>
				Array.isArray(value) ||
				(typeof value === 'object' &&
					value !== null &&
					('url' in value || typeof Reflect.get(value, 'then') === 'function')),
		),
	})
	.transform((urls) => async () => {
		const sources = await urls();
		return urlArrayInputSchema.parse(Array.isArray(sources) ? sources : [sources]);
	});

export type Urls = z.output<typeof urlsSchema>;

export const ScriptShardResult = z.object({
	urls: urlsSchema,
	releaseNotes: releaseNotesSchema,
	replace: z.boolean().optional(),
	skipPrCheck: z.boolean().default(false),
	ignoreOtherPrs: z.boolean().default(false),
	version: z.unknown().pipe(
		z.union([
			z.string(),
			z.object({
				source: z.enum(['display', 'product', 'file', 'fontVersion']),
			}),
		]),
	),
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
