import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { db } from '../db.js';

const createDocumentSchema = z.object({
  title: z.string().min(1, '标题不能为空'),
  category: z.string().default('通用文档'),
  size: z.string().default('1.2 MB'),
  author: z.string().default('Brandon'),
  completion: z.number().default(100),
  tags: z.array(z.string()).optional(),
});

export const documentsRouter = new Hono()
  .get('/', async (c) => {
    try {
      if (!db) return c.json({ success: true, data: [] });
      const { rows } = await db.execute('SELECT * FROM files ORDER BY updated_at DESC');
      const docs = rows.map((r: any) => ({
        id: r.id as string,
        title: r.title as string,
        category: r.category as string,
        size: r.size as string,
        author: r.author as string,
        updatedAt: Number(r.updated_at),
        completion: Number(r.completion),
        tags: JSON.parse((r.tags as string) || '[]'),
      }));
      return c.json({ success: true, data: docs });
    } catch (err: any) {
      return c.json({ success: false, error: err.message }, 500);
    }
  })
  .post('/', zValidator('json', createDocumentSchema), async (c) => {
    try {
      if (!db) return c.json({ success: false, error: 'Database not configured' }, 500);
      const doc = c.req.valid('json');
      const id = `doc-${Date.now()}`;
      const now = Date.now();
      const tags = JSON.stringify(doc.tags || ['新增']);

      await db.execute({
        sql: 'INSERT INTO files (id, title, category, size, author, updated_at, completion, tags) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        args: [
          id, doc.title, doc.category, doc.size,
          doc.author, now, doc.completion, tags
        ]
      });

      return c.json({ success: true, id }, 201);
    } catch (err: any) {
      return c.json({ success: false, error: err.message }, 500);
    }
  })
  .delete('/:id', async (c) => {
    try {
      if (!db) return c.json({ success: false, error: 'Database not configured' }, 500);
      const id = c.req.param('id');
      await db.execute({
        sql: 'DELETE FROM files WHERE id = ?',
        args: [id],
      });
      return c.json({ success: true });
    } catch (err: any) {
      return c.json({ success: false, error: err.message }, 500);
    }
  });
