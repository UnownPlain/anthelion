import { join } from 'node:path';

import fs, { type FileRef } from '@rcompat/fs';
import { parseYaml, type UpdatePackageRequest } from '@unownplain/anthelion-komac';
import ansis from 'ansis';
import { limitAsync } from 'es-toolkit';
import ky from 'ky';

import { getShardsDirectory } from '@/config';
import { installFetchCache } from '@/fetch-cache';
import {
	closeAllButMostRecentPR,
	getLatestFileCommit,
	getLatestRelease,
	getLatestReleaseFromRedirect,
} from '@/github';
import {
	checkVersionInRepo,
	get,
	getShardTarget,
	isStateMatching,
	komac,
	Logger,
	resolveValuePlaceholders,
	updateVersionState,
	vs,
	normalizeVersion,
	resolveDataBackedUrls,
} from '@/helpers';
import { resolveReleaseNotes } from '@/release-notes';
import { JsonShardSchema, Strategy, type JsonShard } from '@/schema/json-shard';
import { ScriptShardResult } from '@/schema/script-shard';
import {
	electronBuilder,
	pageMatch,
	redirectMatch,
	sortVersionsMatch,
	sourceforge,
} from '@/strategies';

installFetchCache();

const MAX_CONCURRENCY = 256;
export const SCRIPTS_FOLDER = 'script';
export const JSON_FOLDER = 'json';

async function updatePackage(options: {
	packageIdentifier: string;
	version: UpdatePackageRequest['version'];
	templateVersion: string;
	urls: () => UpdatePackageRequest['installers'] | Promise<UpdatePackageRequest['installers']>;
	releaseNotes: unknown;
	replace?: boolean;
	font?: boolean;
	logger: Logger;
	githubTag?: string;
	github?: {
		owner: string;
		repo: string;
	};
	templateValues?: Record<string, unknown>;
}) {
	const templateValues = {
		version: options.templateVersion,
		...options.templateValues,
		packageVersion: options.templateVersion,
	};
	const resolvedInstallers = (await options.urls()).map((installer) =>
		typeof installer === 'string'
			? resolveValuePlaceholders(installer, templateValues)
			: { ...installer, url: resolveValuePlaceholders(installer.url, templateValues) },
	);

	options.logger.details(
		options.templateVersion,
		resolvedInstallers.map((installer) =>
			typeof installer === 'string' ? installer : installer.url,
		),
	);

	const { releaseNotes: manifestReleaseNotes, releaseNotesUrl } = await resolveReleaseNotes(
		options.releaseNotes,
		options.packageIdentifier,
		options.templateVersion,
		resolvedInstallers.map((installer) =>
			typeof installer === 'string' ? installer : installer.url,
		),
		options.githubTag,
		options.github,
		templateValues,
	);

	const updateResult = await komac.updatePackage({
		packageIdentifier: options.packageIdentifier,
		version: options.version,
		installers: resolvedInstallers,
		replace: options.replace ? { target: 'latest' } : undefined,
		releaseNotes:
			manifestReleaseNotes || releaseNotesUrl
				? { text: manifestReleaseNotes, url: releaseNotesUrl }
				: undefined,
		packageKind: options.font ? 'font' : 'auto',
		mode: process.env.DRY_RUN ? 'generate' : 'submit',
	});

	options.logger.logUpdateResult(updateResult);

	if (options.replace) {
		await closeAllButMostRecentPR(options.packageIdentifier);
	}

	return updateResult;
}

async function handleScriptShard(file: FileRef, logger: Logger) {
	const shard = await file.import();
	const { version, urls, releaseNotes, replace, skipPrCheck, ignoreOtherPrs, state } =
		ScriptShardResult.parse(await shard.default());
	const { packageIdentifier, font } = getShardTarget(file.base);

	if (state && (await isStateMatching(packageIdentifier, state))) {
		logger.stateMatches();
		return null;
	}

	const resolvedVersion = version;
	const versionForDisplay =
		typeof resolvedVersion === 'string' ? vs(resolvedVersion) : resolvedVersion.source;

	if (
		!skipPrCheck &&
		typeof resolvedVersion === 'string' &&
		(await checkVersionInRepo(resolvedVersion, packageIdentifier, logger, font, ignoreOtherPrs))
	) {
		return null;
	}

	const updateResult = await updatePackage({
		packageIdentifier,
		version: resolvedVersion,
		templateVersion: versionForDisplay,
		urls,
		releaseNotes,
		font,
		replace,
		logger,
	});

	if (state) {
		await updateVersionState(packageIdentifier, state);
	}

	return updateResult;
}

async function resolveJsonShard(shard: JsonShard, initialUrls: UpdatePackageRequest['installers']) {
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
				templateValues: {
					github: {
						version: latest.version,
						tag: latest.tag,
						rawTag: latest.rawTag,
						title: latest.title,
					},
				},
			};
		}
		case Strategy.GithubCommit: {
			const commit = await getLatestFileCommit(shard.github);

			return {
				version: commit,
				urls: () => initialUrls,
				templateValues: {
					github: {
						commit,
					},
				},
			};
		}
		case Strategy.ElectronBuilder:
			return {
				version: await electronBuilder(shard.electronBuilder.url),
				urls: () => initialUrls,
			};
		case Strategy.PageMatch: {
			const { version, captures } = await pageMatch(
				shard.pageMatch.url,
				new RegExp(shard.pageMatch.regex, 'i'),
			);

			return {
				version,
				urls: () => initialUrls,
				templateValues: {
					captures,
				},
			};
		}
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
			const yaml = parseYaml(response, 'failsafe');

			return {
				version: vs(get(yaml, shard.yaml.path)),
				urls: () => resolveDataBackedUrls(initialUrls, yaml),
			};
		}
		case Strategy.Static:
			return {
				version: shard.version,
				urls: () => initialUrls,
			};
	}
}

async function handleJsonShard(file: FileRef, logger: Logger) {
	const shard = JsonShardSchema.parse(await file.json());
	const { packageIdentifier, font } = getShardTarget(file.base);
	const resolvedShard = await resolveJsonShard(shard, shard.urls ?? []);
	const detectedTemplateVersion =
		typeof resolvedShard.version === 'string'
			? normalizeVersion(resolvedShard.version, shard.versionRemove)
			: resolvedShard.version.source;
	const resolvedTemplateValues = {
		...('templateValues' in resolvedShard ? resolvedShard.templateValues : undefined),
		version: detectedTemplateVersion,
	};
	const versionOverride = shard.version;
	const version = normalizeVersion(
		typeof versionOverride === 'string'
			? resolveValuePlaceholders(versionOverride, resolvedTemplateValues)
			: resolvedTemplateValues.version,
		shard.versionRemove,
	);
	const templateValues = {
		...resolvedTemplateValues,
		packageVersion: version,
	};
	let state: string | undefined;

	if (shard.state) {
		switch (shard.state.source) {
			case 'value':
				state = resolveValuePlaceholders(shard.state.value, templateValues);
				break;
			case 'response-header': {
				const url = resolveValuePlaceholders(shard.state.url, templateValues);
				const response = await ky(url, {
					method: shard.state.method ?? 'head',
				});
				const value = response.headers.get(shard.state.header);

				if (!value) {
					throw new Error(`No ${shard.state.header} header found`);
				}

				state = value;
				break;
			}
		}
	}

	const ignoreStateQuotes =
		shard.state?.source === 'response-header' && shard.state.header.toLowerCase() === 'etag';

	if (state && (await isStateMatching(packageIdentifier, state, ignoreStateQuotes))) {
		logger.stateMatches();
		return null;
	}

	if (await checkVersionInRepo(version, packageIdentifier, logger, font, shard.ignoreOtherPrs))
		return null;

	const updateResult = await updatePackage({
		packageIdentifier,
		version: typeof versionOverride === 'object' ? versionOverride : version,
		templateVersion: version,
		urls: resolvedShard.urls,
		releaseNotes: shard.releaseNotes,
		replace: shard.replace,
		font,
		logger,
		githubTag: resolvedShard.githubTag,
		github:
			shard.strategy === Strategy.GithubRelease
				? { owner: shard.github.owner, repo: shard.github.repo }
				: undefined,
		templateValues,
	});

	if (state) {
		await updateVersionState(packageIdentifier, state);
	}

	return updateResult;
}

async function executeShard(file: FileRef) {
	const logger = new Logger();
	const start = performance.now();

	logger.run(file.name);

	try {
		if (file.name.endsWith('ts')) {
			return {
				identifier: file.name,
				updateResult: await handleScriptShard(file, logger),
			};
		} else {
			return {
				identifier: file.name,
				updateResult: await handleJsonShard(file, logger),
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

export async function runAllShards(testShards?: string[], shardsDirectory = getShardsDirectory()) {
	async function listShards(directory: string): Promise<FileRef[]> {
		const ref = fs.ref(directory);
		return (await ref.exists()) ? ref.list() : [];
	}

	const scripts = await listShards(join(shardsDirectory, SCRIPTS_FOLDER));
	const json = await listShards(join(shardsDirectory, JSON_FOLDER));
	let shards: FileRef[] = scripts.concat(json).filter((file) => file.extension !== '.disabled');

	if (testShards) {
		shards = shards.filter((shard) => {
			const { packageIdentifier } = getShardTarget(shard.base);
			return testShards.includes(shard.base) || testShards.includes(packageIdentifier);
		});
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
			if (!updateResult || updateResult.manifests.length === 0) return [];

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
					`### ${update.package.identifier}`,
					`Version: ${update.package.version}`,
					`Pull Request: ${update.pullRequest?.url ?? 'Dry Run'}`,
					`Diff View: ${update.pullRequest?.diffUrl ?? 'Dry Run'}`,
					'',
					'<details>',
					'<summary>Manifests</summary>',
					'',
				);

				for (const manifest of update.manifests) {
					summarySections.push(
						`#### ${manifest.path}`,
						'',
						'```yaml',
						manifest.yaml.trimEnd(),
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
