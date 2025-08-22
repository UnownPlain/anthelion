import { pageMatch } from '../src/helpers.ts';

export default async function () {
	const version = await pageMatch(
		'https://syncroom.yamaha.com/global/v2/play/dl/',
		/href=["']?\/v2\/play\/dl\/app\/SYNCROOM-EN-win-x64-(\d+(?:\.\d+)+)\.zip/i,
	);
	const urls = [
		`https://syncroom.yamaha.com/v2/play/dl/app/SYNCROOM-EN-win-x64-${version}.zip`,
	];

	return {
		version,
		urls,
	};
}
