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
	getPath,
	getShardTarget,
	isStateMatching,
	komac,
	Logger,
	normalizeVersion,
	parseString,
	resolveDataBackedUrls,
	resolveValuePlaceholders,
	updateVersionState,
} from '@/helpers';
import { resolveReleaseNotes } from '@/release-notes';
import { JsonShardSchema, Strategy } from '@/schema/json-shard';
import { ScriptShardResult } from '@/schema/script-shard';
import { electronBuilder, pageMatch, redirectMatch, sortVersions, sourceforge } from '@/strategies';

installFetchCache();

const MAX_CONCURRENCY = 256;
export const SCRIPTS_FOLDER = 'script';
export const JSON_FOLDER = 'json';

type ResolvedShard = {
	version: UpdatePackageRequest['version'];
	templateVersion: string;
	urls: () => UpdatePackageRequest['installers'] | Promise<UpdatePackageRequest['installers']>;
	releaseNotes: unknown;
	replace?: boolean;
	versionToCheck?: string;
	ignoreOtherPrs?: boolean;
	state?: {
		value: string;
		ignoreQuotes?: boolean;
	};
	githubTag?: string;
	github?: {
		owner: string;
		repo: string;
	};
	templateValues?: Record<string, unknown>;
};

type ResolvedJsonStrategy = Pick<ResolvedShard, 'version' | 'urls'> & {
	githubTag?: string;
	templateValues?: Record<string, unknown>;
};

async function executeShard(file: FileRef) {
	const logger = new Logger();
	const start = performance.now();

	logger.run(file.name);

	try {
		const { packageIdentifier, font } = getShardTarget(file.base);
		let shard: ResolvedShard;

		if (file.name.endsWith('ts')) {
			const module = await file.import();
			const { version, urls, releaseNotes, replace, skipPrCheck, ignoreOtherPrs, state } =
				ScriptShardResult.parse(await module.default());
			const templateVersion = typeof version === 'string' ? parseString(version) : version.source;

			shard = {
				version,
				templateVersion,
				urls,
				releaseNotes,
				replace,
				versionToCheck: !skipPrCheck && typeof version === 'string' ? version : undefined,
				ignoreOtherPrs,
				state: state ? { value: state } : undefined,
			};
		} else {
			const jsonShard = JsonShardSchema.parse(await file.json());
			const initialUrls = jsonShard.urls ?? [];
			let resolvedStrategy: ResolvedJsonStrategy;

			switch (jsonShard.strategy) {
				case Strategy.GithubRelease: {
					const needsApiData =
						jsonShard.github.fetchUrlsFromApi ||
						jsonShard.github.preRelease ||
						jsonShard.github.tagFilter ||
						jsonShard.github.fetchLatest;
					const latest = needsApiData
						? await getLatestRelease({
								owner: jsonShard.github.owner,
								repo: jsonShard.github.repo,
								kind: jsonShard.github.preRelease ? 'prerelease' : 'stable',
								tagIncludes: jsonShard.github.tagFilter,
								useLatestEndpoint: jsonShard.github.fetchLatest,
								perPage: jsonShard.github.perPage,
							})
						: await getLatestReleaseFromRedirect({
								owner: jsonShard.github.owner,
								repo: jsonShard.github.repo,
							});

					resolvedStrategy = {
						version: latest.version,
						urls: () => {
							const releaseUrls = jsonShard.github.fetchUrlsFromApi ? latest.urls() : [];

							if (jsonShard.github.fetchUrlsFromApi && releaseUrls.length === 0) {
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
					break;
				}
				case Strategy.GithubCommit: {
					const commit = await getLatestFileCommit(jsonShard.github);

					resolvedStrategy = {
						version: commit,
						urls: () => initialUrls,
						templateValues: {
							github: {
								commit,
							},
						},
					};
					break;
				}
				case Strategy.ElectronBuilder:
					resolvedStrategy = {
						version: (await electronBuilder(jsonShard.electronBuilder)).version,
						urls: () => initialUrls,
					};
					break;
				case Strategy.PageMatch: {
					const { version, captures } = await pageMatch(jsonShard.pageMatch);

					resolvedStrategy = {
						version,
						urls: () => initialUrls,
						templateValues: {
							captures,
						},
					};
					break;
				}
				case Strategy.SortVersions:
					resolvedStrategy = {
						version: (await sortVersions(jsonShard.sortVersions)).version,
						urls: () => initialUrls,
					};
					break;
				case Strategy.Json: {
					const response = await ky(jsonShard.json.url).json();

					resolvedStrategy = {
						version: parseString(getPath(response, jsonShard.json.path)),
						urls: () => resolveDataBackedUrls({ installers: initialUrls, data: response }),
					};
					break;
				}
				case Strategy.RedirectMatch: {
					const result = await redirectMatch(jsonShard.redirectMatch);

					resolvedStrategy = {
						version: result.version,
						urls: () => (jsonShard.urls ? initialUrls : initialUrls.concat(result.url)),
					};
					break;
				}
				case Strategy.SourceForge:
					resolvedStrategy = {
						version: (await sourceforge(jsonShard.sourceforge)).version,
						urls: () => initialUrls,
					};
					break;
				case Strategy.Yaml: {
					const response = await ky(jsonShard.yaml.url).text();
					// This is set to failsafe so incorrectly quoted values aren't parsed as numbers
					const yaml = parseYaml(response, 'failsafe');

					resolvedStrategy = {
						version: parseString(getPath(yaml, jsonShard.yaml.path)),
						urls: () => resolveDataBackedUrls({ installers: initialUrls, data: yaml }),
					};
					break;
				}
				case Strategy.Static:
					resolvedStrategy = {
						version: jsonShard.version,
						urls: () => initialUrls,
					};
					break;
			}

			const detectedTemplateVersion =
				typeof resolvedStrategy.version === 'string'
					? normalizeVersion(resolvedStrategy.version, jsonShard.versionRemove)
					: resolvedStrategy.version.source;
			const resolvedTemplateValues = {
				...('templateValues' in resolvedStrategy ? resolvedStrategy.templateValues : undefined),
				version: detectedTemplateVersion,
			};
			const versionOverride = jsonShard.version;
			const version = normalizeVersion(
				typeof versionOverride === 'string'
					? resolveValuePlaceholders(versionOverride, resolvedTemplateValues)
					: resolvedTemplateValues.version,
				jsonShard.versionRemove,
			);
			const templateValues = {
				...resolvedTemplateValues,
				packageVersion: version,
			};
			let state: string | undefined;

			if (jsonShard.state) {
				switch (jsonShard.state.source) {
					case 'value':
						state = resolveValuePlaceholders(jsonShard.state.value, templateValues);
						break;
					case 'response-header': {
						const url = resolveValuePlaceholders(jsonShard.state.url, templateValues);
						const response = await ky(url, {
							method: jsonShard.state.method ?? 'head',
						});
						const value = response.headers.get(jsonShard.state.header);

						if (!value) {
							throw new Error(`No ${jsonShard.state.header} header found`);
						}

						state = value;
						break;
					}
				}
			}

			const ignoreStateQuotes =
				jsonShard.state?.source === 'response-header' &&
				jsonShard.state.header.toLowerCase() === 'etag';

			shard = {
				version: typeof versionOverride === 'object' ? versionOverride : version,
				templateVersion: version,
				urls: resolvedStrategy.urls,
				releaseNotes: jsonShard.releaseNotes,
				replace: jsonShard.replace,
				versionToCheck: version,
				ignoreOtherPrs: jsonShard.ignoreOtherPrs,
				state: state ? { value: state, ignoreQuotes: ignoreStateQuotes } : undefined,
				githubTag: 'githubTag' in resolvedStrategy ? resolvedStrategy.githubTag : undefined,
				github:
					jsonShard.strategy === Strategy.GithubRelease
						? { owner: jsonShard.github.owner, repo: jsonShard.github.repo }
						: undefined,
				templateValues,
			};
		}

		if (
			shard.state &&
			(await isStateMatching({
				packageIdentifier,
				state: shard.state.value,
				ignoreQuotes: shard.state.ignoreQuotes,
			}))
		) {
			logger.stateMatches();
			return { identifier: file.name, updateResult: null };
		}

		if (
			shard.versionToCheck !== undefined &&
			(await checkVersionInRepo({
				version: shard.versionToCheck,
				packageIdentifier,
				logger,
				font,
				ignoreOtherPrs: shard.ignoreOtherPrs,
			}))
		) {
			return { identifier: file.name, updateResult: null };
		}

		const templateValues = {
			version: shard.templateVersion,
			...shard.templateValues,
			packageVersion: shard.templateVersion,
		};
		const resolvedInstallers = (await shard.urls()).map((installer) =>
			typeof installer === 'string'
				? resolveValuePlaceholders(installer, templateValues)
				: { ...installer, url: resolveValuePlaceholders(installer.url, templateValues) },
		);
		const installerUrls = resolvedInstallers.map((installer) =>
			typeof installer === 'string' ? installer : installer.url,
		);

		logger.details(shard.templateVersion, installerUrls);

		const { releaseNotes, releaseNotesUrl } = await resolveReleaseNotes(
			shard.releaseNotes,
			packageIdentifier,
			shard.templateVersion,
			installerUrls,
			shard.githubTag,
			shard.github,
			templateValues,
		);
		const updateResult = await komac.updatePackage({
			packageIdentifier,
			version: shard.version,
			installers: resolvedInstallers,
			replace: shard.replace ? { target: 'latest' } : undefined,
			releaseNotes:
				releaseNotes || releaseNotesUrl ? { text: releaseNotes, url: releaseNotesUrl } : undefined,
			packageKind: font ? 'font' : 'auto',
			mode: process.env.DRY_RUN ? 'generate' : 'submit',
		});

		logger.logUpdateResult(updateResult);

		if (shard.replace) {
			await closeAllButMostRecentPR(packageIdentifier);
		}

		if (shard.state) {
			await updateVersionState({ packageIdentifier, state: shard.state.value });
		}

		return {
			identifier: file.name,
			updateResult,
		};
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
