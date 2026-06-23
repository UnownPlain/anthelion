import { resolve } from 'node:path';

export function getShardsDirectory() {
	return resolve(process.env.ANTHELION_SHARDS_DIR || 'shards');
}

export function getTargetRepository() {
	return {
		owner: process.env.KOMAC_GITHUB_OWNER || 'microsoft',
		repo: process.env.KOMAC_GITHUB_REPO || 'winget-pkgs',
		branch: process.env.ANTHELION_GITHUB_BRANCH || 'master',
	};
}
