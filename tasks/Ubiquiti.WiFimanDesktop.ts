import ky from 'ky';
import { validateString } from '../src/validate.ts';

export default async function () {
	const versionInfo = await ky
		.post('https://community.svc.ui.com/', {
			body: '{"query":"query ReleaseFeedListQuery($tags: [String!], $betas: [String!], $alphas: [String!], $offset: Int, $limit: Int, $sortBy: ReleasesSortBy, $userIsFollowing: Boolean, $featuredOnly: Boolean, $searchTerm: String, $filterTags: [String!], $filterEATags: [String!], $statuses: [ReleaseStatus!]) {\\n  releases(\\n    tags: $tags\\n    betas: $betas\\n    alphas: $alphas\\n    offset: $offset\\n    limit: $limit\\n    sortBy: $sortBy\\n    userIsFollowing: $userIsFollowing\\n    featuredOnly: $featuredOnly\\n    searchTerm: $searchTerm\\n    filterTags: $filterTags\\n    filterEATags: $filterEATags\\n    statuses: $statuses\\n  ) {\\n    pageInfo {\\n      offset\\n      limit\\n    }\\n    totalCount\\n    items {\\n      id\\n      title\\n      slug\\n      tags\\n      betas\\n      alphas\\n      stage\\n      version\\n      userStatus {\\n        isFollowing\\n        lastViewedAt\\n      }\\n      author {\\n        id\\n        username\\n        isEmployee\\n        avatar {\\n          color\\n          content\\n          image\\n        }\\n      }\\n      createdAt\\n      lastActivityAt\\n      hasUiEngagement\\n      isLocked\\n      stats {\\n        comments\\n        views\\n      }\\n    }\\n  }\\n}","variables":{"limit":30,"offset":0,"sortBy":"LATEST","tags":["60GHz","aircontrol","airmax-aircube","airfiber","airmax","amplifi","unifi-gateway-cloudkey","unifi-connect","unifi-design-center","unifi-access","unifi-drive","edgemax","gigabeam","innerspace","airfiber-ltu","unifi-mobility","unifi-network","unifi-play","unifi-portal","unifi-protect","site-manager","social-media","solar","unifi-switching","unifi-talk","ufiber","uid","uisp-app","isp-design-center","uisp-mobile","uisp-power","unms","wave","unifi-wireless","wifiman"],"betas":[],"alphas":[],"searchTerm":"WiFiman Desktop"},"operationName":"ReleaseFeedListQuery"}',
			headers: { 'content-type': 'application/json' },
		})
		.json<{ data: { releases: { items: Array<{ version: string }> } } }>();

	const version = validateString(versionInfo.data.releases.items[0].version);
	const urls = [
		`https://desktop.wifiman.com/wifiman-desktop-${version}-amd64.exe`,
		`https://desktop.wifiman.com/wifiman-desktop-${version}-arm64.exe`,
	];

	return {
		version,
		urls,
	};
}
