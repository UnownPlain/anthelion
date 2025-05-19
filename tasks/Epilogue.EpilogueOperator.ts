import { updatePackage } from '../src/komac.ts';
import { validateMatch } from '../src/validate.ts';

export default async function () {
	const response = await fetch('https://www.epilogue.co/downloads');
	const versionInfo = await response.text();
	const match = versionInfo.match(
		/href=.*?\/v?(\d+(?:\.\d+)+)\/release\/windows/i,
	);

	const version = validateMatch(match)[1];
	const urls = [
		`https://epilogue.nyc3.cdn.digitaloceanspaces.com/releases/software/Playback/version/${version}/release/windows/playback-setup.exe|64`,
	];

	await updatePackage('Epilogue.EpilogueOperator', version, urls);
}
