import { homedir } from 'node:os';

import fs from '@rcompat/fs';
import { createCodexAppServer } from 'ai-sdk-provider-codex-cli';

import type { AnthelionConfig } from '@/config';

const hasCodex = await fs.exists(process.env.CODEX_HOME || `${homedir()}/.codex`);

export default {
	releaseNotes: hasCodex
		? {
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
			}
		: undefined,
} satisfies AnthelionConfig;
