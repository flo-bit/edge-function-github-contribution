import { NextRequest } from 'next/server'
import cors from '../lib/cors';

export const config = {
  runtime: 'edge',
}

export async function GET(req: NextRequest) {
  const allowUserSelection = false;

  const { searchParams } = new URL(req.url);
  const login = searchParams.get('user');

  if(login && !allowUserSelection) {
    return new Response('User selection is disabled', { status: 400 });
  }

  const query = (login && allowUserSelection ? `
    query($login: String!) {
      user(login: $login) {
      ` : `
    query {
      viewer {
      `) + `
          login
          avatarUrl
          contributionsCollection {
            totalCommitContributions
            totalIssueContributions
            totalPullRequestContributions
            totalPullRequestReviewContributions
            contributionCalendar {
              totalContributions
              weeks {
                contributionDays {
                  date
                  contributionCount
                  color
                }
              }
            }
          }
          repositories(
              first: 100
              ownerAffiliations: OWNER
              privacy: PUBLIC
              orderBy: { field: STARGAZERS, direction: DESC }
          ) {
            totalCount
            nodes {
              name
              stargazerCount
              description
              forkCount
              createdAt
              updatedAt
              watchers {
                totalCount
              }
              languages(first: 10) {
                totalSize
                edges {
                  node {
                    name
                  }
                  size
                }
              }
				    }
          }
          starredRepositories {
            totalCount
          }
          followers {
            totalCount
          }
          following {
            totalCount
          }
          issues_sum:issues{
            totalCount
          }
          issues_open:issues(states: OPEN){
            totalCount
          }
          issues_closed:issues(states: CLOSED){
            totalCount
          }
          pr_sum:pullRequests{
            totalCount
          }
          pr_open:pullRequests(states: OPEN){
            totalCount
          }
          pr_closed:pullRequests(states: CLOSED){
            totalCount
          }
          pr_merged:pullRequests(states: MERGED){
            totalCount
          }
          status {
            emoji
            message
            expiresAt
            updatedAt
          }
        }
      }
  `;

    //
    // to check cost of query, add this to the query (before the last } bracket)
    // rateLimit {
    //   cost
    //   remaining
    // }
    // cost of current query is 1 (rate limit 5000 per hour)
  
    // Fetch data from GitHub using the token stored in Vercel environment variables
    const response = await fetch('https://api.github.com/graphql', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.GITHUB_TOKEN}` // Fetching the GitHub token securely
      },
      body: JSON.stringify({ query, variables: { login } }),
    });
  
    if (!response.ok) {
      return cors(req, new Response(`Error fetching data from GitHub: ${response.statusText}`, { status: 500 }));
    }
  
    const data = await response.json();

    if(!data.data) {
      return cors(req, new Response(`Error fetching data from GitHub: ${data.message}`, { status: 500 }));
    }

    // change from data.data.viewer to data.data.user if necessary
    if(data.data.viewer) {
      data.data.user = data.data.viewer;

      delete data.data.viewer;

      console.log('Changed viewer to user');
    }

    
    return cors(req, new Response(JSON.stringify(data.data), {
      headers: { 'Content-Type': 'application/json' },
    }));
  }