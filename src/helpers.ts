import { compare, parse as parseSemver } from '@std/semver';
import { z } from 'zod';

export class Logger {
	private logs: string[] = [];

	log(line: string) {
		this.logs.push(line);
	}

	flush() {
		for (const line of this.logs) {
			console.log(line);
		}
		this.logs = [];
	}
}

export function sortSemver(versions: string[]) {
	return versions.sort((a, b) => compare(parseSemver(b), parseSemver(a)));
}

export function expect<T>(value: T | null | undefined, message?: string): T {
	if (value === null || value === undefined) {
		throw new Error(message || 'Expected value to be defined');
	}
	return value;
}

export function vs(str: unknown) {
	return z.string().parse(str).trim();
}

export function matchAndValidate(str: string, regex: RegExp): string[] {
	const match = str.match(regex);
	if (!match) {
		throw new Error('Regex match not found');
	}
	return Array.from(match);
}
