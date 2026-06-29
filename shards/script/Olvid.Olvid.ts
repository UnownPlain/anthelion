import ky from 'ky';

import { defineShard } from '@/schema/script-shard.ts';

export default defineShard(async () => {
	const config = await ky('https://server.olvid.io/.well-known/server-config.json').json<{
		app: {
			latest_desktop: number;
		};
	}>();

	const buildVersion = config.app.latest_desktop.toString().padStart(5, '0');
	const version = `${buildVersion.slice(0, -4)}.${Number(buildVersion.slice(-4, -2))}.${Number(buildVersion.slice(-2))}`;

	return {
		version,
		urls: () => [
			`https://static.olvid.io/windows/Olvid-${version}.msi`,
			`https://static.olvid.io/windows/Olvid-${version}.msix`,
		],
	};
});
