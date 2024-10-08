# edge-function-github-contributions

vercel edge function that returns some infos of your github account as a json (contributions, repositories, followers, following, issues, prs, status).

can be called from any frontend application, including static sites.

detailed infos:

- contributions of the last year total, and split by day 
(return the contribution count of each day and a color for each day, that is used to color the heatmap on github)

- contributions of the last year split by type (commits, pull requests, issues)

- up to 100 user owned repositories sorted by most stars
(return the name, description, stars, forks, watchers, top 10 languages each with a name and size in bytes)

- count of: starred repositories, followers, following, repositories, pr requests, issues

- current status of user

see [response type](#response-type) for the full type definition, or [click here to see the response for my account](https://edge-function-github-contribution.vercel.app/api/github-data)

## Usage

1. create a personal access token on github, go to `settings` -> `developer settings` -> `personal access tokens (classic)` -> `generate new token (classic)`, set expiration date to "No expiration" and add the `public_repo` scope.

2. deploy to vercel 

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fflo-bit%2Fedge-function-github-contribution&env=GITHUB_TOKEN)

3. set environment variable `GITHUB_TOKEN` to the personal access token you created in step 1

4. get the url of the deployed function and use it in your application, by sending a GET request to the url

```
https://<your-deployment-url>/api/github-data
```

5. simple example using fetch:

```js
const res = await fetch('https://edge-function-github-contribution.vercel.app/api/github-data');
const json = await res.json(); // as GitHubResponse, see below

console.log(json);
```

7. it's recommended to remove data points you don't need, to reduce the size of the response and speed up the request

## development

to run the function locally, you need to have the vercel cli installed:

```
npm i -g vercel@latest
```

then clone the repository:

```
git clone https://github.com/flo-bit/edge-function-github-contribution
cd edge-function-github-contribution
```

add a `.env` file with the `GITHUB_TOKEN` environment variable and run:

```
vercel dev
```

## response type

if you're using it in a typescript project, here the type definition of the (successful) response:

```ts
const githubGraphColors = ['#ebedf0', '#9be9a8', '#40c463', '#30a14e', '#216e39'] as const;

// Define a type based on the color values
export type GithubGraphColor = (typeof githubGraphColors)[number];

export type GitHubResponse = {
	data: {
		viewer: {
			login: string;
			contributionsCollection: {
				totalCommitContributions: number;
				totalIssueContributions: number;
				totalPullRequestContributions: number;
				totalPullRequestReviewContributions: number;
				contributionCalendar: {
					totalContributions: number;
					weeks: {
						contributionDays: {
							date: string;
							contributionCount: number;
							color: GithubGraphColor;
						}[];
					}[];
				};
			};
			repositories: {
				totalCount: number;
				nodes: {
					name: string;
					stargazerCount: number;
					forkCount: number;
					watchers: {
						totalCount: number;
					};
					languages: {
						totalSize: number;
						edges: {
							node: {
								name: string;
							};
							size: number;
						}[];
					};
				}[];
			};
			starredRepositories: {
				totalCount: number;
			};
			followers: {
				totalCount: number;
			};
			following: {
				totalCount: number;
			};
			issues_sum: {
				totalCount: number;
			};
			issues_open: {
				totalCount: number;
			};
			issues_closed: {
				totalCount: number;
			};
			pr_sum: {
				totalCount: number;
			};
			pr_open: {
				totalCount: number;
			};
			pr_closed: {
				totalCount: number;
			};
			pr_merged: {
				totalCount: number;
			};
			status: {
				emoji?: string;
				message?: string;
				expiresAt?: string;
				updatedAt?: string;
			} | null;
		};
	};
};
```

## calculate more infos

here is a typescript example to combine some of the infos to get:

- total stars of user owned repositories
- total forks of user owned repositories
- total watchers of user owned repositories
- total size of user owned repositories
- total size of each language in user owned repositories

```ts
let totalStars = 0;
let totalSize = 0;
let totalForks = 0;
let totalWatchers = 0;

const languages = new Map<string, number>();

for (const repo of json.data.viewer.repositories.nodes) {
    totalStars += repo.stargazerCount;
    totalSize += repo.languages.totalSize;
    totalForks += repo.forkCount;
    totalWatchers += repo.watchers.totalCount;

    for (const edge of repo.languages.edges) {
        const language = edge.node.name;
        const size = edge.size;
        languages.set(language, (languages.get(language) ?? 0) + size);
    }
}

json.data.viewer.totalStars = totalStars;
json.data.viewer.totalSize = totalSize;
json.data.viewer.totalForks = totalForks;
json.data.viewer.totalWatchers = totalWatchers;
json.data.viewer.languages = Array.from(languages, ([name, size]) => ({ name, size })).sort(
    (a, b) => b.size - a.size
);
```

## add private repositories

if you want to include private repositories, add the `repo:status` scope to your personal access token and remove line 33 in `api/github-data.ts`: `privacy: PUBLIC` (obviously at your own risk).

## rate limits

the function uses the github graphql api, which has a rate limit of 5000 points per hour, the request made costs 1 point, so you can make 5000 requests per hour (or a bit more than 1 per second). that being said, some simple client side caching is always a good idea (e.g. using `localStorage`) and a graceful error handling in case the rate limit is exceeded. more complex caching you'll have to figure out yourself.

## license

MIT