import ky from 'ky';

import { match } from '@/helpers';
import { ReleaseNotesSource } from '@/schema/release-notes';
import { defineShard } from '@/schema/script-shard';
import { pageMatch } from '@/strategies';

export default defineShard(async () => {
	const page = await ky(
		'https://ftp.hp.com/pub/caps-softpaq/CloudRecovery/crsupportedplatform.html',
	).text();

	const {
		groups: [softpaqUrl],
	} = match(
		page,
		/href=["'](https:\/\/ftp\.hp\.com\/pub\/softpaq\/sp\d+-\d+\/sp\d+)\.exe["']\s*>\s*Download Cloud Recovery Client\s*<\/a>/i,
	);

	const { version } = await pageMatch({
		url: `${softpaqUrl}.cva`,
		regex: /(?:^|\r?\n)VendorVersion=(\d+(?:\.\d+)+)(?=\r?\n|$)/i,
	});
	const urls = () => [`${softpaqUrl}.exe`];

	return {
		version,
		urls,
		releaseNotes: {
			source: ReleaseNotesSource.Html,
			sourceUrl: `${softpaqUrl}.html`,
		},
	};
});
