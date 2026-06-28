import ky from 'ky';

import { match } from '@/helpers.ts';
import { defineShard } from '@/schema/script-shard.ts';

export default defineShard(async () => {
	const response = await ky(
		'https://dl.google.com/android/cli/latest/windows_x86_64/android.exe',
	).arrayBuffer();
	const binary = Buffer.from(response).toString('latin1');
	const [version] = match(binary, /version=(\d+(?:\.\d+)+)\b/i);

	return {
		version,
		urls: () => [`https://dl.google.com/android/cli/${version}/windows_x86_64/android.exe|x64`],
		releaseNotes: {
			releaseNotesUrl: 'https://developer.android.com/tools/agents/android-cli/release-notes',
		},
	};
});
