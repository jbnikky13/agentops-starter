import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { exchangeGoogleCode, listAccessibleCustomers, googleAdsConfig } from '../../../../lib/google-ads';
import { encryptSecret } from '../../../../lib/secret-box';

function db() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error('Supabase is not configured.');
  return createClient(url, key, { auth: { persistSession: false } });
}

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const code = url.searchParams.get('code');
    const state = url.searchParams.get('state');
    const error = url.searchParams.get('error');
    const savedState = req.cookies.get('adpilot_google_ads_state')?.value;
    if (error) return NextResponse.redirect(new URL(`/?google_ads=error&message=${encodeURIComponent(error)}`, req.url));
    if (!code || !state || !savedState || state !== savedState) return NextResponse.json({ error: 'Invalid Google Ads OAuth state or missing authorization code.' }, { status: 400 });

    const tokens = await exchangeGoogleCode(code);
    if (!tokens.refresh_token) throw new Error('Google did not return a refresh token. Reconnect and grant offline access.');
    const accounts = await listAccessibleCustomers(tokens.access_token);
    if (!accounts.length) throw new Error('No Google Ads accounts are accessible to this Google user.');

    const configuredCustomer = process.env.GOOGLE_ADS_CUSTOMER_ID?.replace(/-/g, '');
    const customerId = configuredCustomer && accounts.includes(configuredCustomer) ? configuredCustomer : accounts[0];
    const c = googleAdsConfig();
    const client = db();
    const { error: saveError } = await client.from('ad_platform_connections').upsert({
      platform: 'google_ads',
      customer_id: customerId,
      refresh_token_encrypted: encryptSecret(tokens.refresh_token),
      status: 'connected',
      account_name: `Google Ads ${customerId}`,
      metadata: { accessibleCustomers: accounts, loginCustomerId: c.loginCustomerId || null },
      updated_at: new Date().toISOString(),
    }, { onConflict: 'platform' });
    if (saveError) throw saveError;

    const out = NextResponse.redirect(new URL('/?google_ads=connected', req.url));
    out.cookies.delete('adpilot_google_ads_state');
    return out;
  } catch (e) {
    return NextResponse.redirect(new URL(`/?google_ads=error&message=${encodeURIComponent(e instanceof Error ? e.message : 'Google Ads connection failed')}`, req.url));
  }
}
