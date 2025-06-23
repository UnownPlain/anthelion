import { parse as parseYaml } from '@std/yaml';
import ky from 'ky';

export async function komac(...args: string[]) {
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

	return decodedStdout;
}

export async function updatePackage(
	packageId: string,
	version: string,
	urls: string[],
	...args: string[]
) {
	return await komac(
		'update',
		packageId,
		`-v`,
		version,
		`-u`,
		...urls,
		'-s',
		...args,
	);
}

export async function getInstallerInfo(url: string) {
	const installerBytes = await ky(url).arrayBuffer();

	const installer = await Deno.makeTempFile();
	await Deno.writeFile(installer, new Uint8Array(installerBytes));

	const output = await komac('analyse', installer);
	return parseYaml(output);
}
