import { NextResponse } from 'next/server';

export async function GET() {
  const configured = Boolean(process.env.GOOGLE_ADS_DEVELOPER_TOKEN && process.env.GOOGLE_ADS_CLIENT_ID && process.env.GOOGLE_ADS_CLIENT_SECRET);
  return NextResponse.json({
    provider: 'google-ads',
    configured,
    readyForOAuth: configured,
    message: configured ? 'Google Ads credentials are configured. OAuth connection can be enabled next.' : 'Add Google Ads OAuth credentials and developer token to enable the connection.'
  });
}
