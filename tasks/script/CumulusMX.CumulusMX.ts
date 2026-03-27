import { getAllReleases } from '@/github.ts';
import { match } from '@/helpers';

export default async function () {
	const release = (await getAllReleases('cumulusmx', 'CumulusMX'))[0];
	const [version] = match(
		release?.name ?? '',
		/(?:Version\s+)?(\d+(?:\.\d+)+)(?=\s*(?:-\s*(?:Build\s+\d+|b\d+)|$))/i,
	);
	const tag = release?.tag_name.slice(1);

	const urls = [
		`https://github.com/cumulusmx/CumulusMX/releases/download/b${tag}/CumulusMXDist${tag}.zip`,
	];

	return {
		version,
		urls,
	};
}
