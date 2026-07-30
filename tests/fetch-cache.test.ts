import { describe, expect, test } from 'vitest';

import { createCachedFetch } from '../src/fetch-cache';

describe('createCachedFetch', () => {
	test('deduplicates concurrent and subsequent requests', async () => {
		let fetchCount = 0;
		const fetch = createCachedFetch(async () => {
			fetchCount++;
			return new Response('response body');
		});

		const responses = await Promise.all([
			fetch('https://example.com/resource'),
			fetch('https://example.com/resource'),
		]);
		const subsequentResponse = await fetch('https://example.com/resource');

		expect(fetchCount).toBe(1);
		expect(await Promise.all(responses.map((response) => response.text()))).toEqual([
			'response body',
			'response body',
		]);
		expect(await subsequentResponse.text()).toBe('response body');
	});

	test('uses request properties in the cache key', async () => {
		let fetchCount = 0;
		const fetch = createCachedFetch(async () => {
			fetchCount++;
			return new Response();
		});

		await fetch('https://example.com/resource');
		await fetch('https://example.com/resource', { method: 'HEAD' });
		await fetch('https://example.com/resource', { headers: { accept: 'application/json' } });

		expect(fetchCount).toBe(3);
	});

	test('caches HEAD requests unless they opt out', async () => {
		let fetchCount = 0;
		const fetch = createCachedFetch(async () => {
			fetchCount++;
			return new Response();
		});

		await fetch('https://example.com/resource', { method: 'HEAD' });
		await fetch('https://example.com/resource', { method: 'HEAD' });
		await fetch('https://example.com/resource', { method: 'HEAD', cache: 'no-store' });
		await fetch('https://example.com/resource', { method: 'HEAD', cache: 'no-store' });

		expect(fetchCount).toBe(3);
	});

	test('does not cache mutating requests or requests that opt out', async () => {
		let fetchCount = 0;
		const fetch = createCachedFetch(async () => {
			fetchCount++;
			return new Response();
		});

		await fetch('https://example.com/resource', { method: 'POST', body: 'first' });
		await fetch('https://example.com/resource', { method: 'POST', body: 'second' });
		await fetch('https://example.com/resource', { cache: 'no-cache' });
		await fetch('https://example.com/resource', { cache: 'no-store' });

		expect(fetchCount).toBe(4);
	});

	test('passes custom fetch options through without caching', async () => {
		let fetchCount = 0;
		const fetch = createCachedFetch(async () => {
			fetchCount++;
			return new Response();
		});
		const options = { decompress: false } satisfies BunFetchRequestInit;

		await fetch('https://example.com/resource', options);
		await fetch('https://example.com/resource', options);

		expect(fetchCount).toBe(2);
	});

	test('evicts network failures and retryable responses', async () => {
		let fetchCount = 0;
		const fetch = createCachedFetch(async () => {
			fetchCount++;
			if (fetchCount === 1) throw new Error('network failure');
			if (fetchCount === 2) return new Response(null, { status: 503 });
			return new Response('recovered');
		});

		const error = await fetch('https://example.com/resource').catch((error: unknown) => error);
		expect(error).toEqual(new Error('network failure'));
		expect((await fetch('https://example.com/resource')).status).toBe(503);
		expect(await (await fetch('https://example.com/resource')).text()).toBe('recovered');
		expect(fetchCount).toBe(3);
	});
});
