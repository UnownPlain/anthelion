import { Octokit } from 'octokit';
import { extname } from '@std/path';

export const octokit = new Octokit({ auth: Deno.env.get('GITHUB_TOKEN') });
await octokit.rest.users.getAuthenticated();

async function getLatestReleaseData(owner: string, repo: string) {
	const release = await octokit.rest.repos.getLatestRelease({
		owner,
		repo,
	});

	return release;
}

export async function getLatestRelease(owner: string, repo: string) {
	const release = await getLatestReleaseData(owner, repo);

	return release.data.tag_name.startsWith('v')
		? release.data.tag_name.substring(1)
		: release.data.tag_name;
}

export async function getLatestUrls(owner: string, repo: string) {
	const release = (await getLatestReleaseData(owner, repo)).data.assets;
	const urls = [];
	for (const asset of release) {
		if (
			['.exe', '.msi', '.msix', '.msixbundle', '.appx'].includes(
				extname(asset.name),
			)
		) {
			urls.push(asset.browser_download_url);
		}
	}
	return urls;
}

export async function getLatestPreRelease(owner: string, repo: string) {
	const release = await octokit.rest.repos.listReleases({
		owner,
		repo,
	});

	const version = release.data.filter((release) => release.prerelease)[0]
		.tag_name;

	return version.startsWith('v') ? version.substring(1) : version;
}

export async function getTagHash(owner: string, repo: string) {
	const release = await octokit.rest.repos.listTags({
		owner,
		repo,
	});
	return release.data[0].commit.sha;
}

export async function getReleaseByTag(
	owner: string,
	repo: string,
	tag: string,
) {
	const release = await octokit.rest.repos.getReleaseByTag({
		owner,
		repo,
		tag,
	});

	return release.data;
}
