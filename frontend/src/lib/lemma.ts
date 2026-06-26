import { LemmaClient, setTestingToken } from 'lemma-sdk';

let _client: LemmaClient | null = null;

export function getClient(): LemmaClient {
  if (_client) return _client;

  const token = import.meta.env.VITE_LEMMA_TOKEN as string | undefined;
  if (token) setTestingToken(token);

  const isDev = import.meta.env.DEV;
  _client = new LemmaClient({
    apiUrl: (import.meta.env.VITE_LEMMA_API_URL as string | undefined)
      ?? (isDev ? `${window.location.origin}/lemma-api` : 'https://api.lemma.work'),
    authUrl: (import.meta.env.VITE_LEMMA_AUTH_URL as string | undefined)
      ?? (isDev ? `${window.location.origin}/lemma-auth/auth` : 'https://lemma.work/auth'),
    podId: import.meta.env.VITE_LEMMA_POD_ID as string | undefined,
  });

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
