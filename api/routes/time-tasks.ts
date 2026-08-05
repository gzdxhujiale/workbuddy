import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { db } from '../db.js';

async function initTimeTasksTable() {
  if (!db) return;
  try {
    await db.execute(`
      CREATE TABLE IF NOT EXISTS time_tasks (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        priority TEXT NOT NULL DEFAULT '中',
        status TEXT NOT NULL DEFAULT '进行中',
        description TEXT DEFAULT '',
        deadline INTEGER NOT NULL,
        remind_at INTEGER,
        completed_at INTEGER
      );
    `);
  } catch (e) {
    console.error('Failed to auto-init time_tasks table:', e);
  }
}

const createTimeTaskSchema = z.object({
  id: z.string().optional(),
  title: z.string().min(1, '标题不能为空'),
  priority: z.enum(['高', '中', '低']).default('中'),
  status: z.enum(['进行中', '已完成']).default('进行中'),
  description: z.string().default(''),
  deadline: z.number(),
  remindAt: z.number().nullable().optional(),
  completedAt: z.number().nullable().optional(),
});

const updateTimeTaskSchema = z.object({
  title: z.string().optional(),
  priority: z.enum(['高', '中', '低']).optional(),
  status: z.enum(['进行中', '已完成']).optional(),
  description: z.string().optional(),
  deadline: z.number().optional(),
  remindAt: z.number().nullable().optional(),
  completedAt: z.number().nullable().optional(),
});

export const timeTasksRouter = new Hono()
  .get('/', async (c) => {
    try {
      await initTimeTasksTable();
      if (!db) return c.json({ success: true, data: [] });
      const { rows } = await db.execute('SELECT * FROM time_tasks ORDER BY deadline ASC');
      const tasks = rows.map((r: any) => ({
        id: r.id as string,
        title: r.title as string,
        priority: r.priority as any,
        status: r.status as any,
        description: (r.description as string) || '',
        deadline: Number(r.deadline),
        remindAt: r.remind_at != null ? Number(r.remind_at) : null,
        completedAt: r.completed_at != null ? Number(r.completed_at) : null,
      }));
      return c.json({ success: true, data: tasks });
    } catch (err: any) {
      return c.json({ success: false, error: err.message }, 500);
    }
  })
  .post('/', zValidator('json', createTimeTaskSchema), async (c) => {
    try {
      await initTimeTasksTable();
      if (!db) return c.json({ success: false, error: 'Database not configured' }, 500);
      const data = c.req.valid('json');
      const id = data.id || `TM-${Date.now()}-${Math.random().toString(36).substring(7)}`;

      await db.execute({
        sql: `INSERT INTO time_tasks (id, title, priority, status, description, deadline, remind_at, completed_at)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        args: [
          id,
          data.title,
          data.priority,
          data.status,
          data.description || '',
          data.deadline,
          data.remindAt ?? null,
          data.completedAt ?? null,
        ],
      });

      return c.json({ success: true, data: { id } }, 201);
    } catch (err: any) {
      return c.json({ success: false, error: err.message }, 500);
    }
  })
  .patch('/:id', zValidator('json', updateTimeTaskSchema), async (c) => {
    try {
      await initTimeTasksTable();
      if (!db) return c.json({ success: false, error: 'Database not configured' }, 500);
      const id = c.req.param('id');
      const updates = c.req.valid('json');
      const keys = Object.keys(updates);

      if (keys.length > 0) {
        const setClause = keys
          .map((k) => {
            if (k === 'remindAt') return 'remind_at = ?';
            if (k === 'completedAt') return 'completed_at = ?';
            return `${k} = ?`;
          })
          .join(', ');

        const values = keys.map((k) => (updates as any)[k] ?? null);

        await db.execute({
          sql: `UPDATE time_tasks SET ${setClause} WHERE id = ?`,
          args: [...values, id],
        });
      }

      return c.json({ success: true });
    } catch (err: any) {
      return c.json({ success: false, error: err.message }, 500);
    }
  })
  .delete('/:id', async (c) => {
    try {
      await initTimeTasksTable();
      if (!db) return c.json({ success: false, error: 'Database not configured' }, 500);
      const id = c.req.param('id');
      await db.execute({
        sql: 'DELETE FROM time_tasks WHERE id = ?',
        args: [id],
      });
      return c.json({ success: true });
    } catch (err: any) {
      return c.json({ success: false, error: err.message }, 500);
    }
  });
