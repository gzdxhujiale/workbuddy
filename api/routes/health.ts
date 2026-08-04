import { Hono } from 'hono';

export const healthRouter = new Hono()
  .get('/', (c) => {
    return c.json({
      status: 'ok',
      service: 'wenxibuddy-api',
      timestamp: new Date().toISOString(),
    });
  });
