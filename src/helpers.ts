import { parse as parseYaml } from '@std/yaml';
import { validateString } from './validate.ts';
import { compare, parse as parseSemver } from '@std/semver';
import ky from 'ky';

export async function electronBuilder(url: string) {
	const response = await ky(url).text();
	const data = parseYaml(response);
	// @ts-ignore .
	return validateString(data.version);
}

export function sortSemver(versions: string[]) {
	return versions.sort((a, b) => compare(parseSemver(b), parseSemver(a)));
}
