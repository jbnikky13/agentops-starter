import { NextResponse } from 'next/server';
import { googleAdsAuthUrl, googleAdsConfigured } from '../../../../lib/google-ads';
import crypto from 'crypto';

export async function GET() {
  if (!googleAdsConfigured()) return NextResponse.json({ error: 'Google Ads OAuth is not configured yet.' }, { status: 503 });
  const state = crypto.randomBytes(24).toString('hex');
  const response = NextResponse.redirect(googleAdsAuthUrl(state));
  response.cookies.set('adpilot_google_ads_state', state, { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', maxAge: 600, path: '/' });
  return response;
}
