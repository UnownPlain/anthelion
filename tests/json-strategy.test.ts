import { afterEach, describe, expect, test, vi } from 'vitest';

import { resolveDataBackedUrls, resolveValuePlaceholders } from '../src/helpers';
import { JsonShardSchema } from '../src/schema/json-shard';
import { json } from '../src/strategies';

const url = 'https://example.com/latest';
const response = { release: { version: 'v1.2.3', url: 'https://example.com/app.exe' } };

function mockResponse() {
	const requests: ReturnType<Request['clone']>[] = [];
	const fetch = vi.fn(async (input: Request) => {
		requests.push(input.clone());
		return Response.json(response);
	});
	vi.stubGlobal('fetch', fetch);
	return requests;
}

afterEach(() => vi.unstubAllGlobals());

describe('json strategy', () => {
	test('defaults to GET and preserves data-backed URLs and templates', async () => {
		const requests = mockResponse();
		const result = await json({ url, path: 'release.version' });
		const request = requests[0] as ReturnType<Request['clone']>;
		expect(request.method).toBe('GET');
		expect(request.body).toBeNull();
		expect(result.version).toBe('v1.2.3');
		expect(resolveDataBackedUrls({ installers: ['release.url'], data: result.data })).toEqual([
			response.release.url,
		]);
		expect(resolveValuePlaceholders('{data.release.version}', { data: result.data })).toBe(
			'v1.2.3',
		);
	});

	test.each([{ body: { nsc: {} } }, { body: null }, { body: ['stable'] }, { body: false }])(
		'serializes POST body %j as JSON',
		async ({ body }) => {
			const requests = mockResponse();
			await json({ url, path: 'release.version', method: 'post', body });
			const request = requests[0] as ReturnType<Request['clone']>;
			expect(request.method).toBe('POST');
			expect(request.headers.get('content-type')).toBe('application/json');
			expect(await request.json()).toEqual(body);
		},
	);

	test('allows POST without a body', async () => {
		const requests = mockResponse();
		await json({ url, path: 'release.version', method: 'post' });
		const request = requests[0] as ReturnType<Request['clone']>;
		expect(request.method).toBe('POST');
		expect(request.body).toBeNull();
	});

	test('validates request options without changing existing GET shards', () => {
		const shard = { strategy: 'json', urls: ['https://example.com/{version}.exe'] };
		const options = { url, path: 'release.version' };
		for (const request of [
			options,
			{ ...options, method: 'post' },
			{ ...options, method: 'post', body: { nsc: {} } },
		]) {
			expect(JsonShardSchema.safeParse({ ...shard, json: request }).success).toBe(true);
		}
		for (const request of [
			{ ...options, body: {} },
			{ ...options, method: 'get', body: null },
			{ ...options, method: 'delete' },
		]) {
			expect(JsonShardSchema.safeParse({ ...shard, json: request }).success).toBe(false);
		}
	});
});
