import { createClient } from '@libsql/client/web';

const rawUrl = process.env.TURSO_DB_URL || process.env.VITE_TURSO_DB_URL || '';
const dbUrl = rawUrl ? rawUrl.replace(/^turso:\/\//, 'libsql://') : '';
const authToken = process.env.TURSO_DB_AUTH_TOKEN || process.env.VITE_TURSO_DB_AUTH_TOKEN || '';

export const isDbConfigured = Boolean(dbUrl && dbUrl !== 'file:local.db');

export const db = isDbConfigured
  ? createClient({ url: dbUrl, authToken })
  : null;
