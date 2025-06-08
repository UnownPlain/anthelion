import { getLatestRelease } from '../src/github.ts';

export default async function () {
	const version = await getLatestRelease('simonmichael', 'hledger');
	const urls = [
		`https://github.com/simonmichael/hledger/releases/download/${version}/hledger-windows-x64.zip`,
	];

	return {
		version,
		urls,
	};
}
