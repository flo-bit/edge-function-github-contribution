import { NextRequest } from 'next/server'
import cors from '../lib/cors';

export const config = {
  runtime: 'edge',
}

export async function GET(req: NextRequest) {
    // GitHub GraphQL query to get user's contributions
    const query = `
      query {
        viewer {
          login
          contributionsCollection {
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
        }
      }
    `;
  
    // Fetch data from GitHub using the token stored in Vercel environment variables
    const response = await fetch('https://api.github.com/graphql', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.GITHUB_TOKEN}` // Fetching the GitHub token securely
      },
      body: JSON.stringify({ query })
    });
  
    if (!response.ok) {
      return cors(req, new Response(`Error fetching data from GitHub: ${response.statusText}`, { status: 500 }));
    }
  
    const data = await response.json();
  

    return cors(req, new Response(JSON.stringify(data), {
      headers: { 'Content-Type': 'application/json' },
    }));
  }