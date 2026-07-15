import { z } from 'zod';

export const browserRenderingOptionsSchema = z.object({
	url: z.string(),
	waitUntil: z.enum(['load', 'domcontentloaded', 'networkidle0', 'networkidle2']).optional(),
	waitForSelector: z.string().optional(),
});

export type BrowserRenderingOptions = z.infer<typeof browserRenderingOptionsSchema>;

export const browserRenderingResponseSchema = z.object({
	success: z.boolean(),
	errors: z.array(z.object({ code: z.number(), message: z.string() })).optional(),
	result: z.string().optional(),
});
