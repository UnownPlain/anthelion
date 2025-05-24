import { getLatestRelease } from '../src/github.ts';

export default async function () {
	const version = await getLatestRelease('Bedrock-OSS', 'regolith');
	const urls = [
		`https://github.com/Bedrock-OSS/regolith/releases/download/${version}/regolith-${version}.msi`,
	];

	return {
		version,
		urls,
	};
}
