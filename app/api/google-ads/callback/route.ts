import { NextRequest, NextResponse } from 'next/server';
import { googleAdsConfig } from '../../../../lib/google-ads';

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const code = url.searchParams.get('code');
  const state = url.searchParams.get('state');
  const savedState = req.cookies.get('adpilot_google_ads_state')?.value;
  if (!code || !state || !savedState || state !== savedState) return NextResponse.json({ error: 'Invalid Google Ads OAuth state or missing authorization code.' }, { status: 400 });
  const c = googleAdsConfig();
  const body = new URLSearchParams({ client_id: c.clientId, client_secret: c.clientSecret, code, grant_type: 'authorization_code', redirect_uri: c.redirectUri });
  const tokenRes = await fetch('https://oauth2.googleapis.com/token', { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body });
  if (!tokenRes.ok) return NextResponse.json({ error: 'Google OAuth token exchange failed.' }, { status: 502 });
  const tokens = await tokenRes.json();
  // Production note: persist refresh_token encrypted in Supabase; never expose it to the browser.
  const out = NextResponse.redirect(new URL('/?google_ads=connected', req.url));
  out.cookies.delete('adpilot_google_ads_state');
  out.cookies.set('adpilot_google_ads_connected', '1', { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', maxAge: 300, path: '/' });
  void tokens;
  return out;
}
