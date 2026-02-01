import { NextRequest } from 'next/server'
import cors from '../lib/cors';

export const config = {
  runtime: 'edge',
}

const corsOptions = {
  origin: ['https://blento.app', 'https://www.blento.app'],
};

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const owner = searchParams.get('owner');
  const repo = searchParams.get('repo');
  if (!owner || !repo) {
    return cors(req, new Response('Missing required query parameters: owner and repo', { status: 400 }), corsOptions);
  }

  const allContributors: any[] = [];
  let page = 1;

  while (true) {
    const response = await fetch(
      `https://api.github.com/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/contributors?per_page=100&anon=1&page=${page}`,
      {
        headers: {
          'Accept': 'application/vnd.github+json',
          'Authorization': `Bearer ${process.env.GITHUB_TOKEN}`,
        },
      }
    );

    if (!response.ok) {
      return cors(req, new Response(`Error fetching contributors from GitHub: ${response.statusText}`, { status: response.status }), corsOptions);
    }

    const contributors = await response.json();
    if (!Array.isArray(contributors) || contributors.length === 0) break;

    allContributors.push(...contributors);
    if (contributors.length < 100) break;
    page++;
  }

  const data = allContributors.map((c: any) => ({
    username: c.login || c.name || 'anonymous',
    avatarUrl: c.avatar_url || null,
    contributions: c.contributions,
    anonymous: c.type === 'Anonymous',
  }));

  return cors(req, new Response(JSON.stringify(data), {
    headers: { 'Content-Type': 'application/json' },
  }), corsOptions);
}
