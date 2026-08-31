import { NextResponse } from 'next/server';
import { googleAdsSearch } from '@/lib/google-ads';

export async function POST(req: Request) {
  try {
    const { accessToken, customerId, dateRange = 'LAST_30_DAYS' } = await req.json();
    if (!accessToken || !customerId) return NextResponse.json({ error: 'accessToken and customerId are required.' }, { status: 400 });
    const query = `SELECT campaign.id, campaign.name, campaign.status, metrics.impressions, metrics.clicks, metrics.cost_micros, metrics.conversions, metrics.ctr FROM campaign WHERE segments.date DURING ${dateRange}`;
    return NextResponse.json(await googleAdsSearch(accessToken, customerId, query));
  } catch (e) { return NextResponse.json({ error: e instanceof Error ? e.message : 'Metrics request failed' }, { status: 500 }); }
}
