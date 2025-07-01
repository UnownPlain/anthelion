import { pageMatch } from '../src/helpers.ts';

export default async function () {
	const version = await pageMatch(
		'https://www.wireshark.org/update/0/Stratoshark/0.0.0/Windows/x86-64/en-US/stable.xml',
		/<title>Version\s+(\d+(?:\.\d+)+)<\/title>/i,
	);
	const urls = [
		`https://1.na.dl.wireshark.org/win64/Stratoshark-${version}-x64.exe`,
		`https://1.na.dl.wireshark.org/win64/Stratoshark-${version}-arm64.exe`,
	];

	return {
		version,
		urls,
		args: [
			'--release-notes-url',
			`https://stratoshark.org/docs/relnotes/stratoshark-${version}`,
		],
	};
}
