import { compare, parse as parseSemver } from '@std/semver';
import { bgRed, blue, green, redBright } from 'ansis';
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

	run(task: string) {
		this.log(blue`Running: ${task}\n`);
	}

	present(version: string) {
		this.log(green`Package is up-to-date! (${version})`);
	}

	static error(task: string, message: string) {
		console.log(bgRed`❌ Error running ${task}`);
		console.log(redBright`${message}`);
	}

	details(version: string, urls: string[]) {
		this.log(`Version: ${version}`);
		this.log(`URLs: ${urls.join(' ')}\n`);
	}
}

export function sortSemver(versions: string[]) {
	return versions.sort((a, b) => compare(parseSemver(b), parseSemver(a)));
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
