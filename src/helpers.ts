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
		this.log(`${blue('==>')} Running ${task}`);
	}

	present(version: string) {
		this.log(green`Package is up-to-date! (${version})\n`);
	}

	error(task: string, message: string) {
		this.log(bgRed`❌ Error running ${task}`);
		this.log(redBright`${message}\n`);
	}

	details(version: string, urls: string[]) {
		this.log(`Version: ${version}`);
		this.log(`URLs: ${urls.join(' ')}\n`);
	}
}

export function compareVersions(a: string, b: string): number {
	const partsA = a.split('.').map(Number);
	const partsB = b.split('.').map(Number);
	const maxLength = Math.max(partsA.length, partsB.length);

	for (let i = 0; i < maxLength; i++) {
		const numA = partsA[i] ?? 0;
		const numB = partsB[i] ?? 0;
		if (numA !== numB) return numA - numB;
	}

	return 0;
}

export function vs(str: unknown) {
	return z.string().parse(str).trim();
}

export function match(str: string, regex: RegExp): [string, ...string[]] {
	const match = str.match(regex);
	const groups = match?.slice(1);

	if (!groups || groups.length === 0 || groups.some((g) => g === undefined)) {
		throw new Error('Regex match not found');
	}

	return groups as [string, ...string[]];
}
