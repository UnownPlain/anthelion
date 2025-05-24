import { getLatestRelease } from '../src/github.ts';

export default async function () {
	const version = await getLatestRelease('derailed', 'k9s');
	const urls = [
		`https://github.com/derailed/k9s/releases/download/v${version}/k9s_Windows_amd64.zip`,
		`https://github.com/derailed/k9s/releases/download/v${version}/k9s_Windows_arm64.zip`,
	];

	return {
		packageId: 'Derailed.k9s',
		version,
		urls,
	};
}
