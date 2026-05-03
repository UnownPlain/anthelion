import { getLatestRelease } from '@/github.ts';
import { match } from '@/helpers';

export default async function () {
	const release = await getLatestRelease({ owner: 'cumulusmx', repo: 'CumulusMX' });

	const [version] = match(
		release.title ?? '',
		/(?:Version\s+)?(\d+(?:\.\d+)+)(?=\s*(?:-\s*(?:Build\s+\d+|b\d+)|$))/i,
	);
	const urls = () => release.urls();

	return {
		version,
		urls,
	};
}
