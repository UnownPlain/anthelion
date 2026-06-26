import ky from 'ky';

import { compareVersions } from '@/helpers.ts';

export default async function () {
	const response = await ky('https://api.articulate.com/product-artifacts', {
		headers: {
			accept: 'application/vnd.articulate+json;version=2',
		},
	}).json<{
		products: {
			product_family: string;
			version: string;
			package: {
				url: string;
			};
		}[];
	}>();
	const product = response.products
		.filter((product) => product.product_family === 'articulate_360')
		.sort((a, b) => compareVersions(b.version, a.version))[0];

	if (!product) {
		throw new Error('Failed to find Articulate 360');
	}

	return {
		version: product.version,
		urls: () => [`${product.package.url}|x64`],
		releaseNotes: {
			releaseNotesUrl:
				'https://www.articulatesupport.com/article/Articulate-360-Desktop-App-Version-History',
		},
	};
}
