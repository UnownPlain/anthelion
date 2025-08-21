import { parse as parseYaml } from '@std/yaml';
import { spawn } from 'node:child_process';
import { makeTempFile } from '@std/fs/unstable-make-temp-file';
import { writeFile } from '@std/fs/unstable-write-file';
import { extname } from '@std/path';
import ky from 'ky';

export function komac(...args: string[]): Promise<string> {
	return new Promise<string>((resolve, reject) => {
		const cmd = spawn('komac', args, {
			stdio: ['pipe', 'pipe', 'pipe'],
		});

		let stdout = '';
		let stderr = '';

		cmd.stdout?.on('data', (data) => {
			stdout += data.toString();
		});

		cmd.stderr?.on('data', (data) => {
			stderr += data.toString();
		});

		cmd.on('close', (code) => {
			if (code !== 0) {
				reject(new Error(stderr.trim()));
			} else {
				resolve(stdout);
			}
		});

		cmd.on('error', (error) => {
			reject(error);
		});
	});
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
	const installerFile = await ky(url);
	const contentDisposition = installerFile.headers.get('Content-Disposition');
	const filename = contentDisposition
		?.split(';')
		.map((p) => p.trim())
		.filter((p) => p.startsWith('filename='))[0]
		?.split('=')[1];

	if (!filename) throw new Error('Failed to parse file name');

	const installer = await makeTempFile({ suffix: extname(filename) });
	await writeFile(installer, await installerFile.bytes());

	const output = await komac('analyse', installer);

	try {
		return parseYaml(output);
	} catch (err) {
		throw new Error(`Failed to parse YAML output: ${(err as Error).message}`);
	}
}
