import ky from 'ky';

import { defineShard } from '@/schema/script-shard.ts';

export default defineShard(async () => {
	const releases = await ky(
		'https://main-kp-site-gateway-http.prodv2.pac.xvservice.net/api/v2/installers',
	).json<{
		installers: {
			win_qt: {
				version: string;
				locations: {
					default: string;
				};
			};
			win_qt_arm64: {
				version: string;
				locations: {
					default: string;
				};
			};
		};
	}>();

	const version = releases.installers.win_qt.version.replace(/\.(\d+)_release$/, '+$1');
	const urls = () => [
		releases.installers.win_qt.locations.default,
		releases.installers.win_qt_arm64.locations.default,
	];

	return {
		version,
		urls,
	};
});
