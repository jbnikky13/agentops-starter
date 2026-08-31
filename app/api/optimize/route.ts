import { NextResponse } from 'next/server';
import { generateCampaignJson } from '@/lib/gemini';

export async function POST(req: Request) {
  try {
    const { campaign, metrics } = await req.json();
    if (!campaign || !metrics) return NextResponse.json({ error: 'campaign and metrics are required.' }, { status: 400 });
    const prompt = `You are AdPilot's performance optimization agent. Analyze campaign and performance data. Return ONLY JSON with keys: diagnosis, winners, losers, recommendations, newTests, approvalRequired. Never recommend increasing spend automatically. Recommend experiments and flag budget changes for human approval. Campaign: ${JSON.stringify(campaign)} Metrics: ${JSON.stringify(metrics)}`;
    const result = await generateCampaignJson(prompt);
    return NextResponse.json(result);
  } catch (e) { return NextResponse.json({ error: e instanceof Error ? e.message : 'Optimization failed' }, { status: 500 }); }
}
