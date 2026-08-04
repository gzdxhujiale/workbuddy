import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { db } from '../db.js';

const createWorkspaceSchema = z.object({
  name: z.string().min(1, '空间名称不能为空'),
});

export const workspacesRouter = new Hono()
  .get('/', async (c) => {
    try {
      if (!db) return c.json({ success: true, data: [] });
      const { rows } = await db.execute('SELECT * FROM workspaces');
      const workspaces = rows.map((r: any) => r.name as string);
      return c.json({ success: true, data: workspaces });
    } catch (err: any) {
      return c.json({ success: false, error: err.message }, 500);
    }
  })
  .post('/', zValidator('json', createWorkspaceSchema), async (c) => {
    try {
      if (!db) return c.json({ success: false, error: 'Database not configured' }, 500);
      const { name } = c.req.valid('json');
      const id = `ws-${Date.now()}-${Math.random().toString(36).substring(7)}`;

      await db.execute({
        sql: 'INSERT INTO workspaces (id, name) VALUES (?, ?)',
        args: [id, name],
      });

      return c.json({ success: true, name, id }, 201);
    } catch (err: any) {
      return c.json({ success: false, error: err.message }, 500);
    }
  });
