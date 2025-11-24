import ky from 'ky';
import { vs } from '@/helpers.ts';

export default async function () {
	const releases = await ky
		.post('https://community.svc.ui.com/', {
			body: JSON.stringify({
				query: 'query { releases(tags: ["wifiman"]) { items { title version } } }',
			}),
			headers: { 'content-type': 'application/json' },
		})
		.json<{
			data: { releases: { items: Array<{ version: string; title: string }> } };
		}>();
	const release = releases.data.releases.items.filter((r) => r.title.includes('Desktop'));

	const version = vs(release[0]?.version);
	const urls = [
		`https://desktop.wifiman.com/wifiman-desktop-${version}-amd64.exe`,
		`https://desktop.wifiman.com/wifiman-desktop-${version}-arm64.exe`,
	];

	return {
		version,
		urls,
	};
}
