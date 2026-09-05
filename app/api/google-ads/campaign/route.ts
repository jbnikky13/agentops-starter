import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createPausedCampaign, refreshGoogleAccessToken } from '@/lib/google-ads';
import { decryptSecret } from '@/lib/secret-box';

function db() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error('Supabase is not configured.');
  return createClient(url, key, { auth: { persistSession: false } });
}

export async function POST(req: Request) {
  try {
    const { campaignId, approved } = await req.json();
    if (!approved) return NextResponse.json({ error: 'Explicit approval is required before creating an advertising campaign.' }, { status: 403 });
    if (!campaignId) return NextResponse.json({ error: 'campaignId is required.' }, { status: 400 });

    const client = db();
    const { data: campaign, error: campaignError } = await client.from('campaigns').select('*').eq('id', campaignId).single();
    if (campaignError || !campaign) return NextResponse.json({ error: 'Campaign draft not found.' }, { status: 404 });
    if (campaign.status !== 'draft' && campaign.status !== 'approved') return NextResponse.json({ error: `Campaign cannot be launched from status ${campaign.status}.` }, { status: 409 });

    const { data: connection, error: connectionError } = await client.from('ad_platform_connections').select('*').eq('platform', 'google_ads').eq('status', 'connected').single();
    if (connectionError || !connection?.refresh_token_encrypted || !connection.customer_id) return NextResponse.json({ error: 'Connect a Google Ads account before publishing.' }, { status: 409 });

    const accessToken = await refreshGoogleAccessToken(decryptSecret(connection.refresh_token_encrypted));
    const result = await createPausedCampaign(accessToken, connection.customer_id, campaign.brand || 'AdPilot Campaign', Number(campaign.daily_budget || 0));
    const external = result?.results?.[0]?.resourceName || null;
    const { error: updateError } = await client.from('campaigns').update({ status: 'approved', approved_at: new Date().toISOString(), platform: 'google_ads', external_campaign_id: external, updated_at: new Date().toISOString() }).eq('id', campaignId);
    if (updateError) throw updateError;
    await client.from('campaign_events').insert({ campaign_id: campaignId, event_type: 'google_ads_campaign_created_paused', event_data: { resourceName: external } });
    return NextResponse.json({ status: 'created_paused', resourceName: external });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Campaign creation failed' }, { status: 500 });
  }
}
