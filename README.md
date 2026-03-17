# Copy Machine by OfferLaunch

AI-powered sales copy generator for high-ticket offers.

## Deploy to Vercel

1. Push this repo to GitHub
2. Import in [vercel.com/new](https://vercel.com/new)
3. Add environment variable: `ANTHROPIC_API_KEY`
4. Deploy
5. Add custom domain: `copy.offerlaunch.ai`

## Local Development

```bash
npm install
npm run dev
```

Runs at http://localhost:3000

## Environment Variables

| Variable | Description |
|----------|-------------|
| `ANTHROPIC_API_KEY` | Anthropic API key for Claude |

## Tech Stack

- Next.js 14 (App Router)
- Tailwind CSS
- Anthropic Claude API (Sonnet for speed, Opus for VSLs)
- Streaming SSE responses
