import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { googleAdsConfigured } from '@/lib/google-ads';

export async function GET() {
  try {
    const configured = googleAdsConfigured();
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!configured || !url || !key) return NextResponse.json({ provider: 'google-ads', configured, connected: false, readyForOAuth: configured });
    const client = createClient(url, key, { auth: { persistSession: false } });
    const { data } = await client.from('ad_platform_connections').select('customer_id,status,account_name,updated_at').eq('platform', 'google_ads').maybeSingle();
    return NextResponse.json({ provider: 'google-ads', configured, connected: data?.status === 'connected', customerId: data?.customer_id || null, accountName: data?.account_name || null, updatedAt: data?.updated_at || null, readyForOAuth: true });
  } catch (e) {
    return NextResponse.json({ provider: 'google-ads', configured: false, connected: false, error: e instanceof Error ? e.message : 'Status check failed' }, { status: 500 });
  }
}
