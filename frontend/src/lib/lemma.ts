import { LemmaClient, setTestingToken } from 'lemma-sdk';

const isDev = import.meta.env.DEV;

function buildClient(): LemmaClient {
  const token = import.meta.env.VITE_LEMMA_TOKEN as string | undefined;
  if (isDev && token) setTestingToken(token);

  return new LemmaClient({
    apiUrl: (import.meta.env.VITE_LEMMA_API_URL as string | undefined)
      ?? (isDev ? `${window.location.origin}/lemma-api` : 'https://api.lemma.work'),
    authUrl: (import.meta.env.VITE_LEMMA_AUTH_URL as string | undefined)
      ?? (isDev ? `${window.location.origin}/lemma-auth/auth` : 'https://lemma.work/auth'),
    podId: import.meta.env.VITE_LEMMA_POD_ID as string | undefined,
  });
}

export const client = buildClient();

export function getClient(): LemmaClient { return client; }

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
