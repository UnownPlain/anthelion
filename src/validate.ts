import { z } from 'zod';

// deno-lint-ignore no-explicit-any
export function validateString(str: any | unknown) {
	return z.string().parse(str).trim();
}

export function matchAndValidate(str: string, regex: RegExp): string[] {
	const match = str.match(regex);
	if (!match) {
		throw new Error('Unable to parse version');
	}
	return Array.from(match);
}
