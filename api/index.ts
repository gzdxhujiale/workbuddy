import { Hono } from 'hono';
import { handle } from 'hono/vercel';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { healthRouter } from './routes/health.js';
import { tasksRouter } from './routes/tasks.js';
import { documentsRouter } from './routes/documents.js';
import { workspacesRouter } from './routes/workspaces.js';
import { schedulesRouter } from './routes/schedules.js';
import { timeTasksRouter } from './routes/time-tasks.js';

export const config = {
  runtime: 'edge',
};

const app = new Hono().basePath('/api');

// Global error handler
app.onError((err, c) => {
  console.error('API Error:', err);
  return c.json({
    success: false,
    error: err.message || 'Internal Server Error',
  }, 500);
});

// Global middleware
app.use('*', logger());
app.use('*', cors());

// Routes
const routes = app
  .route('/health', healthRouter)
  .route('/tasks', tasksRouter)
  .route('/documents', documentsRouter)
  .route('/workspaces', workspacesRouter)
  .route('/schedules', schedulesRouter)
  .route('/time-tasks', timeTasksRouter);

export type AppType = typeof routes;
export { app };
export const handler = handle(app);
export default handler;
