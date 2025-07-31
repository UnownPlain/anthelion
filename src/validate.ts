import { z } from 'zod';

export function validateString(str: unknown) {
	return z.string().parse(str).trim();
}

export function matchAndValidate(str: string, regex: RegExp): string[] {
	const match = str.match(regex);
	if (!match) {
		throw new Error('Unable to parse version');
	}
	return Array.from(match);
}
