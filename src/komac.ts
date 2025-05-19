import { z } from 'zod';
import { parse as parseYaml } from '@std/yaml';

export async function runKomac(...args: string[]) {
	const cmd = new Deno.Command('komac', {
		args: args,
		stdin: 'piped',
		stdout: 'piped',
		stderr: 'piped',
	}).spawn();

	const { code, stdout, stderr } = await cmd.output();
	const decodedStdout = new TextDecoder().decode(stdout);
	const decodedStderr = new TextDecoder().decode(stderr);

	if (code !== 0) {
		throw new Error(decodedStderr);
	}

	return { decodedStdout, decodedStderr, code };
}

export async function komac(...args: string[]) {
	const output = await runKomac(...args);
	console.log(output.decodedStdout);
}

export async function komacSilent(...args: string[]) {
	const output = await runKomac(...args);
	return output.decodedStdout.trim();
}

export async function updatePackage(
	packageId: string,
	version: string,
	urls: string[],
	...args: string[]
) {
	console.log('Version:', version);
	console.log(`URL(s): ${urls.join(' ')}`);
	console.log(); // Explicitly log a blank line after the URL(s)
	await komac('update', packageId, `-v`, version, `-u`, ...urls, '-s', ...args);
}

export async function getInstallerInfo(url: string) {
	const appsAndFeaturesEntrySchema = z
		.object({
			DisplayVersion: z.string(),
		})
		.passthrough();

	const installerInfoSchema = z
		.object({
			AppsAndFeaturesEntries: z.array(appsAndFeaturesEntrySchema),
		})
		.passthrough();

	const response = await fetch(url);
	const installerBytes = await response.bytes();

	const installer = await Deno.makeTempFile();
	await Deno.writeFile(installer, installerBytes);

	const output = await komacSilent('analyse', installer);
	return installerInfoSchema.parse(parseYaml(output));
}
