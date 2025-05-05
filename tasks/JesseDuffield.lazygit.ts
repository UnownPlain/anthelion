import { getLatestRelease } from '../src/github.ts';
import { updatePackage } from '../src/komac.ts';

export default async function () {
	const version = await getLatestRelease('jesseduffield', 'lazygit');
	const urls = [
		`https://github.com/jesseduffield/lazygit/releases/download/v${version}/lazygit_${version}_Windows_32-bit.zip`,
		`https://github.com/jesseduffield/lazygit/releases/download/v${version}/lazygit_${version}_Windows_x86_64.zip`,
		`https://github.com/jesseduffield/lazygit/releases/download/v${version}/lazygit_${version}_Windows_arm64.zip`,
		`https://github.com/jesseduffield/lazygit/releases/download/v${version}/lazygit_${version}_Windows_armv6.zip`,
	];

	await updatePackage('JesseDuffield.lazygit', version, urls);
}
