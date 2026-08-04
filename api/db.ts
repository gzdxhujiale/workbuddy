import { createClient } from '@libsql/client/web';
import dotenv from 'dotenv';

dotenv.config();

const rawUrl =
  process.env.TURSO_DB_URL ||
  process.env.VITE_TURSO_DB_URL ||
  (typeof import.meta !== 'undefined' && (import.meta as any).env && (import.meta as any).env.VITE_TURSO_DB_URL) ||
  'file:local.db';

const dbUrl = String(rawUrl).replace(/^turso:\/\//, 'libsql://');

const authToken =
  process.env.TURSO_DB_AUTH_TOKEN ||
  process.env.VITE_TURSO_DB_AUTH_TOKEN ||
  (typeof import.meta !== 'undefined' && (import.meta as any).env && (import.meta as any).env.VITE_TURSO_DB_AUTH_TOKEN) ||
  '';

export const turso = createClient({
  url: dbUrl,
  authToken,
});
