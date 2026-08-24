const CACHEABLE_METHODS = new Set(['GET', 'HEAD']);
const RETRYABLE_STATUS_CODES = new Set([408, 413, 429, 500, 502, 503, 504]);
const REQUEST_INIT_PROPERTIES = new Set([
	'body',
	'cache',
	'credentials',
	'duplex',
	'headers',
	'integrity',
	'keepalive',
	'method',
	'mode',
	'priority',
	'redirect',
	'referrer',
	'referrerPolicy',
	'signal',
	'window',
]);

type Fetch = (input: string | URL | Request, init?: BunFetchRequestInit) => Promise<Response>;

type CachedResponse = {
	controller: AbortController;
	consumers: number;
	isPending: () => boolean;
	response: Promise<Response>;
	token: symbol;
};

function cacheKey(request: Request) {
	return JSON.stringify([
		request.method,
		request.url,
		Array.from(request.headers).sort(([first], [second]) => first.localeCompare(second)),
		request.cache,
		request.credentials,
		request.integrity,
		request.mode,
		request.redirect,
		request.referrer,
		request.referrerPolicy,
	]);
}

function waitForResponse(
	response: Promise<Response>,
	signal: AbortSignal | null,
): Promise<Response> {
	if (!signal) return response;

	return new Promise<Response>((resolve, reject) => {
		const abort = () => reject(signal.reason);
		const removeAbortListener = () => signal.removeEventListener('abort', abort);

		response.then(
			(result) => {
				removeAbortListener();
				resolve(result);
			},
			(error: unknown) => {
				removeAbortListener();
				reject(error);
			},
		);

		if (signal.aborted) {
			abort();
			return;
		}

		signal.addEventListener('abort', abort, { once: true });
	});
}

export function createCachedFetch(fetch: Fetch): Fetch {
	const responses = new Map<string, CachedResponse>();

	function deleteResponse(key: string, token: symbol) {
		if (responses.get(key)?.token === token) {
			responses.delete(key);
		}
	}

	const cachedFetch = async (
		input: string | URL | Request,
		init?: BunFetchRequestInit,
	): Promise<Response> => {
		const request =
			input instanceof Request ? new Request(input, init) : new Request(input.toString(), init);
		if (
			!CACHEABLE_METHODS.has(request.method) ||
			request.cache === 'no-cache' ||
			request.cache === 'no-store' ||
			request.cache === 'reload' ||
			(init && Object.keys(init).some((property) => !REQUEST_INIT_PROPERTIES.has(property)))
		) {
			return fetch(input, init);
		}

		const key = cacheKey(request);
		let cachedResponse = responses.get(key);

		if (!cachedResponse) {
			const controller = new AbortController();
			const networkRequest = new Request(request, { signal: controller.signal });
			const token = Symbol();
			let pending = true;
			const response = Promise.resolve()
				.then(() => fetch(networkRequest))
				.then(
					(result) => {
						pending = false;
						if (RETRYABLE_STATUS_CODES.has(result.status)) {
							deleteResponse(key, token);
						}
						return result;
					},
					(error: unknown) => {
						pending = false;
						deleteResponse(key, token);
						throw error;
					},
				);

			cachedResponse = {
				controller,
				consumers: 0,
				isPending: () => pending,
				response,
				token,
			};
			responses.set(key, cachedResponse);
		}

		cachedResponse.consumers++;
		try {
			return (await waitForResponse(cachedResponse.response, request.signal)).clone() as Response;
		} finally {
			cachedResponse.consumers--;
			if (cachedResponse.consumers === 0 && cachedResponse.isPending()) {
				deleteResponse(key, cachedResponse.token);
				cachedResponse.controller.abort();
			}
		}
	};

	return cachedFetch;
}

let installedFetch: Fetch | undefined;

export function installFetchCache() {
	if (!installedFetch) {
		const originalFetch = globalThis.fetch;
		installedFetch = createCachedFetch(originalFetch.bind(globalThis));
		globalThis.fetch = Object.assign(installedFetch, {
			preconnect: originalFetch.preconnect.bind(originalFetch),
		});
	}

	return installedFetch;
}
