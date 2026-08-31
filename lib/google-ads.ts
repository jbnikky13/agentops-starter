export function googleAdsConfig() {
  return {
    developerToken: process.env.GOOGLE_ADS_DEVELOPER_TOKEN || '',
    clientId: process.env.GOOGLE_ADS_CLIENT_ID || '',
    clientSecret: process.env.GOOGLE_ADS_CLIENT_SECRET || '',
    redirectUri: process.env.GOOGLE_ADS_REDIRECT_URI || ''
  };
}

export function googleAdsConfigured() {
  const c = googleAdsConfig();
  return Boolean(c.developerToken && c.clientId && c.clientSecret && c.redirectUri);
}

export function googleAdsAuthUrl(state: string) {
  const c = googleAdsConfig();
  const params = new URLSearchParams({
    client_id: c.clientId,
    redirect_uri: c.redirectUri,
    response_type: 'code',
    access_type: 'offline',
    prompt: 'consent',
    scope: 'https://www.googleapis.com/auth/adwords',
    state
  });
  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
}
