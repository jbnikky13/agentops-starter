# AdPilot AI

AI advertising copilot / agent MVP. Paste a product URL, campaign goal, budget and target country. AdPilot analyzes the page and returns an audience, hooks, channel plan, ad concepts, tracking plan and optimization actions.

## Included
- Next.js 14 App Router dashboard
- Website URL analyzer
- OpenAI-powered campaign strategy when `OPENAI_API_KEY` is configured
- Deterministic heuristic fallback when no AI key is configured
- Vitals Arcade preloaded as the first demo campaign
- Human approval gate before ad spend
- UTM/conversion tracking plan
- Architecture ready for Google, Meta, TikTok and X ad adapters

## Run locally

```bash
npm install
cp .env.example .env.local
npm run dev
```

Open http://localhost:3000.

## Environment

`OPENAI_API_KEY` is optional. If present, the analyzer uses OpenAI. `OPENAI_MODEL` defaults to `gpt-4o-mini`.

Never commit API keys. Add them to Vercel/project environment variables.

## Next phase
1. Persist projects/campaign drafts in Supabase.
2. Add authentication and multi-user workspaces.
3. Add Google Ads API connection.
4. Add Meta Ads and TikTok Ads adapters.
5. Add conversion analytics and campaign metrics ingestion.
6. Add creative image/video generation.
7. Add scheduled optimization jobs with explicit budget-change approval.

## Safety
AdPilot is designed to recommend and prepare campaigns first. Publishing campaigns, changing budgets, or spending money should require explicit user authorization. Generated copy must not invent product claims.
