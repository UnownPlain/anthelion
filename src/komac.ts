import { parse as parseYaml } from '@std/yaml';
import { spawn } from 'node:child_process';
import { makeTempFile } from '@std/fs/unstable-make-temp-file';
import { writeFile } from '@std/fs/unstable-write-file';
import ky from 'ky';

export function komac(...args: string[]) {
	return new Promise((resolve, reject) => {
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
	const installerFileBuffer = await ky(url).arrayBuffer();

	const installer = await makeTempFile();
	await writeFile(installer, new Uint8Array(installerFileBuffer));

	const output = await komac('analyse', installer);
	return parseYaml(output as string);
}
