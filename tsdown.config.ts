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
		dts: true,
		fixedExtension: false,
		hash: false,
		alias: {
			'@': './src',
		},
		deps: {
			neverBundle: [/^(?!@\/)[^./]/],
		},
		minify: true,
	},
	{
		entry: {
			main: 'src/main.ts',
			test: 'src/test.ts',
		},
		dts: false,
		clean: false,
		outDir: 'dist/bin',
		fixedExtension: false,
		hash: false,
		alias: {
			'@': './src',
		},
		deps: {
			neverBundle: [/^(?!@\/)[^./]/],
		},
		minify: true,
		outputOptions: {
			banner: (chunk) =>
				chunk.fileName === 'main.js' || chunk.fileName === 'test.js' ? '#!/usr/bin/env bun' : '',
			chunkFileNames: 'chunks/[name].js',
		},
	},
]);
