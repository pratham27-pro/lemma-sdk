import { LemmaClient, setTestingToken } from 'lemma-sdk';

let _client: LemmaClient | null = null;
let _refreshTimer: ReturnType<typeof setTimeout> | null = null;

function jwtExpiry(token: string): number {
  try {
    const b64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
    return JSON.parse(atob(b64)).exp * 1000;
  } catch {
    return 0;
  }
}

function buildClient(): LemmaClient {
  const isDev = import.meta.env.DEV;
  return new LemmaClient({
    apiUrl: (import.meta.env.VITE_LEMMA_API_URL as string | undefined)
      ?? (isDev ? `${window.location.origin}/lemma-api` : 'https://api.lemma.work'),
    authUrl: (import.meta.env.VITE_LEMMA_API_URL as string | undefined)
      ?? (isDev ? `${window.location.origin}/lemma-auth/auth` : 'https://lemma.work/auth'),
    podId: import.meta.env.VITE_LEMMA_POD_ID as string | undefined,
  });
}

async function callRefresh(refreshTok: string): Promise<string | null> {
  const isDev = import.meta.env.DEV;
  const base = isDev ? `${window.location.origin}/lemma-api` : 'https://api.lemma.work';
  try {
    const res = await fetch(`${base}/st/auth/session/refresh`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'st-auth-mode': 'header',
        'Authorization': `Bearer ${refreshTok}`,
      },
    });
    if (!res.ok) return null;
    const newToken = res.headers.get('st-access-token');
    if (newToken) return newToken;
    const data = await res.json().catch(() => ({})) as Record<string, unknown>;
    return (data.accessToken ?? data.access_token ?? null) as string | null;
  } catch {
    return null;
  }
}

function scheduleRefresh(accessToken: string, _refreshTok: string) {
  if (_refreshTimer) clearTimeout(_refreshTimer);
  const expiry = jwtExpiry(accessToken);
  const delay = Math.max(10_000, expiry - Date.now() - 5 * 60 * 1000); // 5 min before expiry
  _refreshTimer = setTimeout(() => initAuth(), delay);
}

export async function initAuth(): Promise<void> {
  const token = (import.meta.env.VITE_LEMMA_TOKEN as string | undefined) ?? '';
  const refreshTok = (import.meta.env.VITE_LEMMA_REFRESH_TOKEN as string | undefined) ?? '';

  if (!token) return;

  const expiry = jwtExpiry(token);
  const needsRefresh = Date.now() > expiry - 5 * 60 * 1000;

  if (needsRefresh && refreshTok) {
    const fresh = await callRefresh(refreshTok);
    if (fresh) {
      setTestingToken(fresh);
      _client = buildClient();
      scheduleRefresh(fresh, refreshTok);
      return;
    }
  }

  setTestingToken(token);
  _client = buildClient();
  if (refreshTok && expiry > Date.now()) {
    scheduleRefresh(token, refreshTok);
  }
}

export function getClient(): LemmaClient {
  if (!_client) {
    // Fallback: sync init without refresh (initAuth should have been called first)
    const token = (import.meta.env.VITE_LEMMA_TOKEN as string | undefined) ?? '';
    if (token) setTestingToken(token);
    _client = buildClient();
  }
  return _client;
}

export const TABLE = {
  TICKETS: 'tickets',
  SIGNALS: 'signals',
  CLUSTERS: 'clusters',
  REPORTS: 'reports',
} as const;

export const FUNCTION = {
  PROCESS_TICKET: 'process_ticket',
  RECLUSTER_ALL: 'recluster_all',
  GENERATE_DIGEST: 'generate_digest',
} as const;

export const WORKFLOW = {
  DIGEST: 'digest_pipeline',
} as const;

export const AGENT = {
  EXTRACTION: 'extraction-agent',
  CLUSTERING: 'clustering-agent',
  REPLY_DRAFT: 'reply-draft-agent',
} as const;
