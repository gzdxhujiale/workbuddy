import { Hono } from 'hono';
import { turso } from '../db';

export const workspacesRoute = new Hono()
  .get('/', async (c) => {
    const { rows } = await turso.execute('SELECT * FROM workspaces');
    const workspaces = rows.map((r: any) => r.name as string);
    return c.json(workspaces);
  })
  .post('/', async (c) => {
    const body = await c.req.json<{ name: string }>();
    const name = body.name;
    const id = `ws-${Date.now()}-${Math.random().toString(36).substring(7)}`;
    await turso.execute({
      sql: 'INSERT INTO workspaces (id, name) VALUES (?, ?)',
      args: [id, name],
    });
    return c.json({ success: true, name, id });
  });
