import { makeTempFile } from '@std/fs/unstable-make-temp-file';
import { writeFile } from '@std/fs/unstable-write-file';
import { spawn, YAML } from 'bun';
import ky from 'ky';
import { extname } from 'node:path';

export async function komac(...args: string[]) {
	const proc = spawn(['komac', ...args], {
		stdout: 'pipe',
		stderr: 'pipe',
	});
	await proc.exited;
	if (proc.exitCode !== 0) {
		throw new Error((await proc.stderr.text()).trimEnd());
	}
	return (await proc.stdout.text()).trim();
}

export async function updatePackage(
	packageId: string,
	version: string,
	urls: string[],
	...args: string[]
) {
	return await komac('update', packageId, `-v`, version, `-u`, ...urls, '-s', ...args);
}

export async function getInstallerInfo(url: string) {
	const installerFile = await ky(url);
	const contentDisposition = installerFile.headers.get('Content-Disposition');
	const filename = contentDisposition
		?.split(';')
		.map((p) => p.trim())
		.filter((p) => p.startsWith('filename='))[0]
		?.split('=')[1];

	if (!filename) throw new Error('Failed to parse file name');

	const installer = await makeTempFile({ suffix: extname(filename) });
	await writeFile(installer, new Uint8Array(await installerFile.arrayBuffer()));

	const output = await komac('analyse', installer);

	try {
		return YAML.parse(output);
	} catch (e) {
		throw new Error(`Failed to parse YAML output: ${(e as Error).message}`);
	}
}
