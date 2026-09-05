import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { googleAdsSearch, refreshGoogleAccessToken } from '@/lib/google-ads';
import { decryptSecret } from '@/lib/secret-box';

function db() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error('Supabase is not configured.');
  return createClient(url, key, { auth: { persistSession: false } });
}

const ranges = new Set(['TODAY', 'YESTERDAY', 'LAST_7_DAYS', 'LAST_30_DAYS']);

export async function POST(req: Request) {
  try {
    const { dateRange = 'LAST_30_DAYS', campaignId } = await req.json().catch(() => ({}));
    if (!ranges.has(dateRange)) return NextResponse.json({ error: 'Unsupported dateRange.' }, { status: 400 });
    const client = db();
    const { data: connection, error: connectionError } = await client.from('ad_platform_connections').select('*').eq('platform', 'google_ads').eq('status', 'connected').single();
    if (connectionError || !connection?.refresh_token_encrypted || !connection.customer_id) return NextResponse.json({ error: 'Connect a Google Ads account first.' }, { status: 409 });
    const accessToken = await refreshGoogleAccessToken(decryptSecret(connection.refresh_token_encrypted));
    const query = `SELECT campaign.id, campaign.name, campaign.status, metrics.impressions, metrics.clicks, metrics.cost_micros, metrics.conversions, metrics.ctr FROM campaign WHERE segments.date DURING ${dateRange}`;
    const result = await googleAdsSearch(accessToken, connection.customer_id, query);
    if (campaignId) {
      const { data: campaign } = await client.from('campaigns').select('id,external_campaign_id').eq('id', campaignId).single();
      if (campaign?.external_campaign_id) {
        const externalId = campaign.external_campaign_id.split('/').pop();
        const rows = (result?.results || []).filter((r: any) => String(r?.campaign?.id) === String(externalId));
        for (const row of rows) {
          await client.from('campaign_events').insert({ campaign_id: campaignId, event_type: 'google_ads_metrics_snapshot', event_data: row });
        }
      }
    }
    return NextResponse.json(result);
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Metrics request failed' }, { status: 500 });
  }
}
