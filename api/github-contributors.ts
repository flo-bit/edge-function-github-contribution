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
  const perPage = Math.min(Number(searchParams.get('per_page') || 30), 100);

  if (!owner || !repo) {
    return cors(req, new Response('Missing required query parameters: owner and repo', { status: 400 }), corsOptions);
  }

  const response = await fetch(
    `https://api.github.com/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/contributors?per_page=${perPage}`,
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

  const data = contributors.map((c: any) => ({
    username: c.login,
    avatarUrl: c.avatar_url,
    contributions: c.contributions,
  }));

  return cors(req, new Response(JSON.stringify(data), {
    headers: { 'Content-Type': 'application/json' },
  }), corsOptions);
}
