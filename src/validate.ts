import { z } from 'zod/v4';
import { red } from 'ansis';

// deno-lint-ignore no-explicit-any
export function validateString(str: any) {
	return z.string().parse(str).trim();
}

export function validateMatch(match: RegExpMatchArray | null) {
	if (!match) {
		throw new Error(red`Unable to parse version`);
	}
	return match;
}
