import fs, { type FileRef } from '@rcompat/fs';
import { updateVersion } from '@unownplain/anthelion-komac';
import ansis from 'ansis';
import { limitAsync } from 'es-toolkit';
import ky from 'ky';
import { parse } from 'yaml';

import { getLatestRelease, getLatestReleaseFromRedirect } from '@/github';
import {
	closeAllButMostRecentPR,
	checkVersionInRepo,
	get,
	isStateMatching,
	Logger,
	resolveVersionPlaceholders,
	updateVersionState,
	vs,
	normalizeVersion,
	resolveDataBackedUrls,
} from '@/helpers';
import { resolveReleaseNotes } from '@/release-notes';
import { JsonShardSchema, Strategy, type JsonShard } from '@/schema/json-shard';
import { normalizedReleaseNotesSchema } from '@/schema/release-notes';
import { ScriptShardResult, type Urls } from '@/schema/script-shard';
import {
	electronBuilder,
	pageMatch,
	redirectMatch,
	sortVersionsMatch,
	sourceforge,
} from '@/strategies';

const MAX_CONCURRENCY = 256;
export const SCRIPTS_FOLDER = 'shards/script';
export const JSON_FOLDER = 'shards/json';

async function updatePackage(options: {
	packageIdentifier: string;
	version: string;
	urls: Urls;
	releaseNotes: unknown;
	replace?: boolean;
	installerMatches?: string[];
	logger: Logger;
	githubTag?: string;
	github?: {
		owner: string;
		repo: string;
	};
}) {
	const resolvedUrls = (await options.urls()).map((url) =>
		resolveVersionPlaceholders(url, options.version),
	);
	const { releaseNotes: manifestReleaseNotes, releaseNotesUrl } = await resolveReleaseNotes(
		normalizedReleaseNotesSchema(options.version).safeParse(options.releaseNotes).data,
		options.packageIdentifier,
		options.version,
		options.githubTag,
		options.github,
	);

	options.logger.details(options.version, resolvedUrls);

	const updateResult = await updateVersion({
		packageIdentifier: options.packageIdentifier,
		version: options.version,
		urls: resolvedUrls,
		replace: options.replace ? 'latest' : undefined,
		releaseNotes: manifestReleaseNotes,
		releaseNotesUrl: releaseNotesUrl,
		installerMatches: options.installerMatches,
		dryRun: Boolean(process.env.DRY_RUN),
		token: process.env.GITHUB_TOKEN!,
	});

	options.logger.logUpdateResult(updateResult);

	if (options.replace) {
		await closeAllButMostRecentPR(options.packageIdentifier);
	}

	return updateResult;
}

async function handleScriptShard(fileName: string, logger: Logger) {
	const shard = await import(`../${SCRIPTS_FOLDER}/${fileName}`);
	const { version, urls, releaseNotes, replace, skipPrCheck, state, installerMatches } =
		ScriptShardResult.parse(await shard.default());
	const packageIdentifier = fileName.replace('.ts', '');

	if (state && (await isStateMatching(packageIdentifier, state))) {
		logger.stateMatches();
		return null;
	}

	const resolvedVersion = vs(typeof version === 'function' ? version() : version);

	if (!skipPrCheck && (await checkVersionInRepo(resolvedVersion, packageIdentifier, logger))) {
		return null;
	}

	const updateResult = await updatePackage({
		packageIdentifier,
		version: resolvedVersion,
		urls,
		releaseNotes,
		installerMatches,
		replace,
		logger,
	});

	if (state) {
		await updateVersionState(packageIdentifier, state);
	}

	return updateResult;
}

async function resolveJsonShard(shard: JsonShard, initialUrls: string[]) {
	switch (shard.strategy) {
		case Strategy.GithubRelease: {
			const needsApiData =
				shard.github.fetchUrlsFromApi ||
				shard.github.preRelease ||
				shard.github.tagFilter ||
				shard.github.fetchLatest;
			const latest = needsApiData
				? await getLatestRelease({
						owner: shard.github.owner,
						repo: shard.github.repo,
						kind: shard.github.preRelease ? 'prerelease' : 'stable',
						tagIncludes: shard.github.tagFilter,
						useLatestEndpoint: shard.github.fetchLatest,
						perPage: shard.github.perPage,
					})
				: await getLatestReleaseFromRedirect({
						owner: shard.github.owner,
						repo: shard.github.repo,
					});

			return {
				version: latest.version,
				urls: () => {
					const releaseUrls = shard.github.fetchUrlsFromApi ? latest.urls() : [];

					if (shard.github.fetchUrlsFromApi && releaseUrls.length === 0) {
						throw new Error('No URLs found in GitHub release');
					}

					return initialUrls.concat(releaseUrls);
				},
				githubTag: latest.rawTag,
			};
		}
		case Strategy.ElectronBuilder:
			return {
				version: await electronBuilder(shard.electronBuilder.url),
				urls: () => initialUrls,
			};
		case Strategy.PageMatch:
			return {
				version: await pageMatch(shard.pageMatch.url, new RegExp(shard.pageMatch.regex, 'i')),
				urls: () => initialUrls,
			};
		case Strategy.SortVersions:
			return {
				version: await sortVersionsMatch(
					shard.sortVersions.url,
					new RegExp(shard.sortVersions.regex, 'i'),
				),
				urls: () => initialUrls,
			};
		case Strategy.Json: {
			const response = await ky(shard.json.url).json();

			return {
				version: vs(get(response, shard.json.path)),
				urls: () => resolveDataBackedUrls(initialUrls, response),
			};
		}
		case Strategy.RedirectMatch: {
			const result = await redirectMatch(
				shard.redirectMatch.url,
				new RegExp(shard.redirectMatch.regex, 'i'),
			);

			return {
				version: result.version,
				urls: () => (shard.urls ? initialUrls : initialUrls.concat(result.url)),
			};
		}
		case Strategy.SourceForge:
			return {
				version: await sourceforge(shard.sourceforge.project, shard.sourceforge.file),
				urls: () => initialUrls,
			};
		case Strategy.Yaml: {
			const response = await ky(shard.yaml.url).text();
			// This is set to failsafe so incorrectly quoted values aren't parsed as numbers
			const yaml = parse(response, { schema: 'failsafe' });

			return {
				version: vs(get(yaml, shard.yaml.path)),
				urls: () => resolveDataBackedUrls(initialUrls, yaml),
			};
		}
	}
}

async function handleJsonShard(fileName: string, logger: Logger) {
	const file = await fs.ref(`./${JSON_FOLDER}/${fileName}`).json();
	const shard = JsonShardSchema.parse(file);
	const packageIdentifier = fileName.replace('.json', '');
	const resolvedShard = await resolveJsonShard(shard, shard.urls ?? []);
	const version = normalizeVersion(resolvedShard.version, shard.versionRemove);

	if (await checkVersionInRepo(version, packageIdentifier, logger)) return null;

	return updatePackage({
		packageIdentifier,
		version,
		urls: resolvedShard.urls,
		releaseNotes: shard.releaseNotes,
		replace: shard.replace,
		logger,
		githubTag: resolvedShard.githubTag,
		github:
			shard.strategy === Strategy.GithubRelease
				? { owner: shard.github.owner, repo: shard.github.repo }
				: undefined,
	});
}

async function executeShard(file: FileRef) {
	const logger = new Logger();
	const start = performance.now();

	logger.run(file.name);

	try {
		if (file.name.endsWith('ts')) {
			return {
				identifier: file.name,
				updateResult: await handleScriptShard(file.name, logger),
			};
		} else {
			return {
				identifier: file.name,
				updateResult: await handleJsonShard(file.name, logger),
			};
		}
	} catch (e) {
		logger.error(file.name, e);
		throw e;
	} finally {
		logger.duration(file.name, performance.now() - start);
		logger.blankLine();
		logger.flush();
	}
}

export async function runAllShards(testShards?: string[]) {
	const scripts = await fs.ref(SCRIPTS_FOLDER).list();
	const json = await fs.ref(JSON_FOLDER).list();
	let shards: FileRef[] = scripts.concat(json).filter((file) => file.extension !== '.disabled');

	if (testShards) {
		shards = shards.filter((shard) => testShards.includes(shard.base));
	}

	if (shards.length === 0) {
		console.log(ansis.red`Error: No shards found`);
		process.exit(1);
	}

	console.log(`Found ${shards.length} shards to run\n`);

	const results = await Promise.allSettled(shards.map(limitAsync(executeShard, MAX_CONCURRENCY)));

	const failures = results.flatMap((result, i) => {
		const file = shards[i];
		if (result.status !== 'rejected' || !file) return [];
		return [{ result, file }];
	});

	const completed = `✅ Run completed: ${shards.length - failures.length}/${shards.length} shards successful`;

	if (process.env.GITHUB_STEP_SUMMARY) {
		const generatedManifests = results.flatMap((result) => {
			if (result.status !== 'fulfilled') return [];
			const updateResult = result.value.updateResult;
			if (!updateResult || updateResult.changes.length === 0) return [];

			return [updateResult];
		});

		const runErrors = failures
			.map(
				(failedShard) =>
					`### ❌ Error in ${failedShard.file.name}\n\`\`\`\n${ansis.strip(failedShard.result.reason.message)}\n\`\`\`\n`,
			)
			.join('');

		const summarySections = ['# Summary', '', completed];

		if (generatedManifests.length > 0) {
			summarySections.push('', '## Generated Manifests', '');

			for (const update of generatedManifests) {
				summarySections.push(
					`### ${update.packageIdentifier}`,
					`Version: ${update.version}`,
					`Pull Request: ${update.pullRequestUrl ?? 'Dry Run'}`,
					'',
					'<details>',
					'<summary>Manifests</summary>',
					'',
				);

				for (const manifest of update.changes) {
					summarySections.push(
						`#### ${manifest.path}`,
						'',
						'```yaml',
						manifest.content.trimEnd(),
						'```',
						'',
					);
				}

				summarySections.push('</details>', '');
			}
		}

		if (runErrors) {
			summarySections.push('', '## Run Errors', '', runErrors);
		}

		const summary = summarySections.join('\n');

		await fs.ref(process.env.GITHUB_STEP_SUMMARY).write(summary);
	}

	console.log(completed);

	return failures.length;
}

if (import.meta.main) {
	await runAllShards();
}
