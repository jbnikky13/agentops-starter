const GOOGLE_ADS_API_VERSION = process.env.GOOGLE_ADS_API_VERSION || 'v25';
const GOOGLE_ADS_BASE = `https://googleads.googleapis.com/${GOOGLE_ADS_API_VERSION}`;

export function googleAdsConfig() {
  return {
    developerToken: process.env.GOOGLE_ADS_DEVELOPER_TOKEN || '',
    clientId: process.env.GOOGLE_ADS_CLIENT_ID || '',
    clientSecret: process.env.GOOGLE_ADS_CLIENT_SECRET || '',
    redirectUri: process.env.GOOGLE_ADS_REDIRECT_URI || '',
    loginCustomerId: (process.env.GOOGLE_ADS_LOGIN_CUSTOMER_ID || '').replace(/-/g, ''),
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
    state,
  });
  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
}

function headers(accessToken: string) {
  const c = googleAdsConfig();
  const h: Record<string, string> = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${accessToken}`,
    'developer-token': c.developerToken,
  };
  if (c.loginCustomerId) h['login-customer-id'] = c.loginCustomerId;
  return h;
}

async function googleJson(url: string, init: RequestInit, context: string) {
  const response = await fetch(url, init);
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const message = data?.error?.message || data?.error?.status || `Google Ads ${context} failed (${response.status})`;
    throw new Error(message);
  }
  return data;
}

export async function exchangeGoogleCode(code: string) {
  const c = googleAdsConfig();
  const body = new URLSearchParams({ client_id: c.clientId, client_secret: c.clientSecret, code, grant_type: 'authorization_code', redirect_uri: c.redirectUri });
  return googleJson('https://oauth2.googleapis.com/token', { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body }, 'OAuth token exchange');
}

export async function refreshGoogleAccessToken(refreshToken: string) {
  const c = googleAdsConfig();
  const body = new URLSearchParams({ client_id: c.clientId, client_secret: c.clientSecret, refresh_token: refreshToken, grant_type: 'refresh_token' });
  const data = await googleJson('https://oauth2.googleapis.com/token', { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body }, 'access-token refresh');
  return data.access_token as string;
}

export async function listAccessibleCustomers(accessToken: string) {
  const data = await googleJson(`${GOOGLE_ADS_BASE}/customers:listAccessibleCustomers`, { method: 'GET', headers: headers(accessToken) }, 'account discovery');
  return (data.resourceNames || []).map((resourceName: string) => resourceName.split('/').pop()).filter(Boolean) as string[];
}

export async function googleAdsSearch(accessToken: string, customerId: string, query: string) {
  const id = customerId.replace(/-/g, '');
  return googleJson(`${GOOGLE_ADS_BASE}/customers/${id}/googleAds:search`, { method: 'POST', headers: headers(accessToken), body: JSON.stringify({ query }) }, 'search');
}

export async function createPausedCampaign(accessToken: string, customerId: string, name: string, dailyBudgetUsd: number) {
  const id = customerId.replace(/-/g, '');
  const amountMicros = Math.max(1, Math.round(dailyBudgetUsd * 1_000_000));
  const budget = await googleJson(`${GOOGLE_ADS_BASE}/customers/${id}/campaignBudgets:mutate`, {
    method: 'POST', headers: headers(accessToken), body: JSON.stringify({ operations: [{ create: { name: `${name} Budget`, amountMicros: String(amountMicros), deliveryMethod: 'STANDARD', explicitlyShared: false } }] }),
  }, 'budget creation');
  const budgetResource = budget?.results?.[0]?.resourceName;
  if (!budgetResource) throw new Error('Google Ads did not return a campaign budget resource.');
  return googleJson(`${GOOGLE_ADS_BASE}/customers/${id}/campaigns:mutate`, {
    method: 'POST', headers: headers(accessToken), body: JSON.stringify({ operations: [{ create: { name, advertisingChannelType: 'SEARCH', status: 'PAUSED', campaignBudget: budgetResource, manualCpc: { enhancedCpcEnabled: false } } }] }),
  }, 'campaign creation');
}

export function normalizeCustomerId(value: string) { return value.replace(/-/g, '').trim(); }
