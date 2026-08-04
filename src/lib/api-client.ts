import { hc } from 'hono/client';
import type { AppType } from '../../api/index';

const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000';
export const apiClient = hc<AppType>(baseUrl);
