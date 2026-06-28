import { defineConfig } from 'tsdown';

export default defineConfig([
	{
		entry: {
			'schema/script-shard': 'src/schema/script-shard.ts',
			config: 'src/config.ts',
			github: 'src/github.ts',
			helpers: 'src/helpers.ts',
			strategies: 'src/strategies.ts',
			'schema/release-notes': 'src/schema/release-notes.ts',
		},
		format: 'esm',
		dts: {
			tsgo: true,
		},
		clean: true,
		outDir: 'dist',
		platform: 'node',
		target: 'esnext',
		fixedExtension: false,
		hash: false,
		alias: {
			'@': './src',
		},
		deps: {
			neverBundle: [/^(?!@\/)[^./]/],
		},
	},
	{
		entry: {
			main: 'src/main.ts',
		},
		format: 'esm',
		dts: false,
		clean: false,
		outDir: 'dist/bin',
		platform: 'node',
		target: 'esnext',
		fixedExtension: false,
		hash: false,
		alias: {
			'@': './src',
		},
		banner: '#!/usr/bin/env bun',
		outputOptions: {
			codeSplitting: false,
		},
		deps: {
			neverBundle: [/^(?!@\/)[^./]/],
		},
	},
	{
		entry: {
			test: 'src/test.ts',
		},
		format: 'esm',
		dts: false,
		clean: false,
		outDir: 'dist/bin',
		platform: 'node',
		target: 'esnext',
		fixedExtension: false,
		hash: false,
		alias: {
			'@': './src',
		},
		banner: '#!/usr/bin/env bun',
		deps: {
			neverBundle: [/^(?!@\/)[^./]/],
		},
	},
]);
