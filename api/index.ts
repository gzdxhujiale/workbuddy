import { Hono } from 'hono';
import { workspacesRoute } from './routes/workspaces';
import { tasksRoute } from './routes/tasks';
import { filesRoute } from './routes/files';
import { schedulesRoute } from './routes/schedules';

const app = new Hono().basePath('/api');

app.onError((err, c) => {
  console.error('[Hono API Error]', err);
  return c.json(
    {
      error: err.message || 'Internal Server Error',
      stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
    },
    500
  );
});

const routes = app
  .route('/workspaces', workspacesRoute)
  .route('/tasks', tasksRoute)
  .route('/files', filesRoute)
  .route('/schedules', schedulesRoute);

export type AppType = typeof routes;

export default app;
