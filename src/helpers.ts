import { parse as parseYaml } from '@std/yaml';
import { validateString } from './validate.ts';
import { compare, parse as parseSemver } from '@std/semver';

export async function electronBuilder(url: string) {
	const response = await fetch(url);
	const yaml = await response.text();
	const data = parseYaml(yaml);
	// @ts-ignore .
	return validateString(data.version);
}

export function sortSemver(versions: string[]) {
	return versions.sort((a, b) => compare(parseSemver(b), parseSemver(a)));
}
