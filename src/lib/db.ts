import { createClient } from '@libsql/client/web';

const rawUrl = import.meta.env.VITE_TURSO_DB_URL || 'file:local.db';
const dbUrl = rawUrl.replace(/^turso:\/\//, 'libsql://');
const authToken = import.meta.env.VITE_TURSO_DB_AUTH_TOKEN || '';

export const turso = createClient({
  url: dbUrl,
  authToken,
});
