import { createCodexAppServer } from 'ai-sdk-provider-codex-cli';

import type { AnthelionConfig } from '@/config';

export default {
	releaseNotes: {
		model: () =>
			createCodexAppServer()('gpt-6-luna', {
				threadMode: 'persistent',
				idleTimeoutMs: 1000,
				approvalPolicy: 'never',
				sandboxPolicy: { type: 'readOnly' },
				configOverrides: {
					forced_login_method: 'chatgpt',
					'features.shell_tool': false,
					web_search: 'disabled',
					project_doc_max_bytes: 0,
				},
			}),
		concurrency: 5,
	},
} satisfies AnthelionConfig;
