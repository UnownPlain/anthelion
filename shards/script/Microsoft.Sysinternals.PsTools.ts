import ky from 'ky';

import { match } from '@/helpers';
import { defineShard } from '@/schema/script-shard.ts';

export default defineShard(async () => {
	const response = await ky.head('https://download.sysinternals.com/files/PSTools.zip');
	const state = response.headers.get('last-modified') || '';

	const [day, monthStr, year] = match(state, /^[A-Za-z]{3},\s+(\d{2})\s+([A-Za-z]{3})\s+(\d{4})/);

	const months: Record<string, string> = {
		Jan: '01',
		Feb: '02',
		Mar: '03',
		Apr: '04',
		May: '05',
		Jun: '06',
		Jul: '07',
		Aug: '08',
		Sep: '09',
		Oct: '10',
		Nov: '11',
		Dec: '12',
	};
	const month = months[monthStr!];

	const version = `${year}-${month}-${day}`;
	const urls = () => [
		{
			url: 'https://download.sysinternals.com/files/PSTools.zip',
			nestedInstallerMatches: ['PsExec.exe'],
		},
	];

	return {
		version,
		urls,
		replace: true,
		state,
	};
});
