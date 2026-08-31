# AdPilot AI

AI advertising copilot / agent MVP. Paste a product URL, campaign goal, budget and target country. AdPilot analyzes the page and returns an audience, hooks, channel plan, ad concepts, tracking plan and optimization actions.

## Current stack
- Next.js 14 App Router
- Gemini API (`@google/genai`) for campaign intelligence
- Gemini `gemini-2.5-flash-lite` by default
- Supabase for campaign-draft persistence
- Vitals Arcade preloaded as the first demo campaign
- Human approval gate before ad spend
- UTM/conversion tracking plan
- Provider-ready architecture for Google Ads, Meta, TikTok and X

## Gemini instead of OpenAI
Yes. AdPilot now uses Gemini. Google currently provides a free Gemini API tier with free input/output tokens for supported models and rate limits; production limits and model availability can change. See Google's current pricing before scaling. citehttps://ai.google.dev/gemini-api/docs/pricing

Create a key in Google AI Studio and configure:

```env
GEMINI_API_KEY=your_key
GEMINI_MODEL=gemini-2.5-flash-lite
```

Google's current getting-started documentation uses `GEMINI_API_KEY` for API authentication. citehttps://ai.google.dev/gemini-api/docs/get-started

## Supabase setup

1. Create/open the Supabase project.
2. Run `supabase/schema.sql` in the SQL editor.
3. Add these server environment variables:

```env
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

The service-role key must remain server-side and must never be exposed as a `NEXT_PUBLIC_` variable.

Campaign drafts are stored in `campaigns`; platform connection metadata and future performance events have their own tables.

## Run locally

```bash
npm install
cp .env.example .env.local
npm run dev
```

Open http://localhost:3000.

## Ad platform roadmap

The repository now has environment placeholders and a persistence model for:

- Google Ads
- Meta Ads
- TikTok Ads
- X Ads

Google Ads supports programmatic campaign creation through the Google Ads API, including budgets, bidding, campaign type and dates. The production connector should be enabled only after the user's advertising account is explicitly connected and the campaign is approved. See Google's current campaign API documentation: https://developers.google.com/google-ads/api/docs/campaigns/create-campaigns

The next implementation step is OAuth/account connection plus read-only performance ingestion, followed by approved campaign publishing. We should not put ad-platform access tokens in the client or repository.

## Agent loop

```text
Website URL
   ↓
Product analyzer
   ↓
Campaign strategist
   ↓
Creative generator
   ↓
Campaign draft
   ↓
Human approval
   ↓
Ad platform adapter
   ↓
Performance ingestion
   ↓
Optimization agent
   ↓
New creative/budget recommendation
   ↓
Human approval for material spend changes
```

## Safety

AdPilot is designed to recommend and prepare campaigns first. Publishing campaigns, changing budgets, or spending money requires explicit user authorization. Generated copy must not invent product claims, and entertainment products must not be presented as medical or diagnostic tools.
