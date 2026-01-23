import ky from 'ky';

import { match } from '@/helpers.ts';

export default async function () {
	const response = await ky('https://aka.ms/ttd/download').text();

	const [version] = match(
		response,
		/MainBundle Name="Microsoft\.TimeTravelDebugging" Version="([^"]+)/i,
	);
	const urls = [
		`https://windbg.download.prss.microsoft.com/dbazure/prod/${version?.replaceAll('.', '-')}/TTD.msixbundle`,
	];

	return {
		version,
		urls,
	};
}
