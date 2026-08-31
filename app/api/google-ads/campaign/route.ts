import { NextResponse } from 'next/server';
import { createPausedCampaign } from '@/lib/google-ads';

export async function POST(req: Request) {
  try {
    const { accessToken, customerId, name, dailyBudgetUsd, approved } = await req.json();
    if (!approved) return NextResponse.json({ error: 'Explicit approval is required before creating an advertising campaign.' }, { status: 403 });
    if (!accessToken || !customerId || !name || !dailyBudgetUsd) return NextResponse.json({ error: 'accessToken, customerId, name and dailyBudgetUsd are required.' }, { status: 400 });
    const result = await createPausedCampaign(accessToken, customerId, name, Number(dailyBudgetUsd));
    return NextResponse.json({ status: 'created_paused', result });
  } catch (e) { return NextResponse.json({ error: e instanceof Error ? e.message : 'Campaign creation failed' }, { status: 500 }); }
}
