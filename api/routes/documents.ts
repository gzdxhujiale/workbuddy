import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { db } from '../db.js';

const createKnowledgeBaseSchema = z.object({
  title: z.string().min(1, '标题不能为空'),
  categoryId: z.string().nullable().optional(),
  content: z.string().default(''),
  sortOrder: z.number().default(0),
});

const updateKnowledgeBaseSchema = z.object({
  title: z.string().optional(),
  categoryId: z.string().nullable().optional(),
  content: z.string().optional(),
  sortOrder: z.number().optional(),
});

const batchCategorySchema = z.object({
  fromCategoryId: z.string().nullable(),
  toCategoryId: z.string().nullable(),
});

export const documentsRouter = new Hono()
  // GET /api/documents - List all non-deleted knowledge bases
  .get('/', async (c) => {
    try {
      if (!db) return c.json({ success: true, data: [] });
      const { rows } = await db.execute(
        'SELECT * FROM knowledge_bases WHERE deleted_at IS NULL ORDER BY sort_order ASC, updated_at DESC'
      );
      const docs = rows.map((r: any) => ({
        id: r.id as string,
        title: r.title as string,
        sortOrder: Number(r.sort_order || 0),
        categoryId: (r.category_id || r.category) ? (r.category_id || r.category) as string : null,
        content: (r.content as string) || '',
        updatedAt: Number(r.updated_at),
        deletedAt: r.deleted_at ? Number(r.deleted_at) : null,
      }));
      return c.json({ success: true, data: docs });
    } catch (err: any) {
      return c.json({ success: false, error: err.message }, 500);
    }
  })

  // POST /api/documents - Create new document
  .post('/', zValidator('json', createKnowledgeBaseSchema), async (c) => {
    try {
      if (!db) return c.json({ success: false, error: 'Database not configured' }, 500);
      const data = c.req.valid('json');
      const id = `kb-${Date.now()}`;
      const now = Date.now();
      const categoryId = data.categoryId || null;

      await db.execute({
        sql: 'INSERT INTO knowledge_bases (id, title, sort_order, category_id, content, updated_at, deleted_at) VALUES (?, ?, ?, ?, ?, ?, NULL)',
        args: [id, data.title, data.sortOrder ?? 0, categoryId, data.content || '', now],
      });

      return c.json({ success: true, id }, 201);
    } catch (err: any) {
      return c.json({ success: false, error: err.message }, 500);
    }
  })

  // POST /api/documents/batch-category - Batch update doc category
  .post('/batch-category', zValidator('json', batchCategorySchema), async (c) => {
    try {
      if (!db) return c.json({ success: false, error: 'Database not configured' }, 500);
      const { fromCategoryId, toCategoryId } = c.req.valid('json');
      const now = Date.now();

      if (fromCategoryId === null) {
        await db.execute({
          sql: 'UPDATE knowledge_bases SET category_id = ?, updated_at = ? WHERE category_id IS NULL AND deleted_at IS NULL',
          args: [toCategoryId, now],
        });
      } else {
        await db.execute({
          sql: 'UPDATE knowledge_bases SET category_id = ?, updated_at = ? WHERE category_id = ? AND deleted_at IS NULL',
          args: [toCategoryId, now, fromCategoryId],
        });
      }

      return c.json({ success: true });
    } catch (err: any) {
      return c.json({ success: false, error: err.message }, 500);
    }
  })

  // PUT /api/documents/:id - Update single document
  .put('/:id', zValidator('json', updateKnowledgeBaseSchema), async (c) => {
    try {
      if (!db) return c.json({ success: false, error: 'Database not configured' }, 500);
      const id = c.req.param('id');
      const data = c.req.valid('json');
      const now = Date.now();

      const existingRes = await db.execute({
        sql: 'SELECT * FROM knowledge_bases WHERE id = ? AND deleted_at IS NULL',
        args: [id],
      });

      if (existingRes.rows.length === 0) {
        return c.json({ success: false, error: 'Knowledge base doc not found' }, 404);
      }

      const existing = existingRes.rows[0];
      const newTitle = data.title !== undefined ? data.title : existing.title;
      const newCategoryId = data.categoryId !== undefined ? data.categoryId : (existing.category_id || existing.category);
      const newContent = data.content !== undefined ? data.content : existing.content;
      const newSortOrder = data.sortOrder !== undefined ? data.sortOrder : existing.sort_order;

      await db.execute({
        sql: 'UPDATE knowledge_bases SET title = ?, category_id = ?, content = ?, sort_order = ?, updated_at = ? WHERE id = ?',
        args: [newTitle, newCategoryId, newContent, newSortOrder, now, id],
      });

      return c.json({ success: true, updatedAt: now });
    } catch (err: any) {
      return c.json({ success: false, error: err.message }, 500);
    }
  })

  // DELETE /api/documents/:id - Soft Delete
  .delete('/:id', async (c) => {
    try {
      if (!db) return c.json({ success: false, error: 'Database not configured' }, 500);
      const id = c.req.param('id');
      const now = Date.now();
      await db.execute({
        sql: 'UPDATE knowledge_bases SET deleted_at = ? WHERE id = ?',
        args: [now, id],
      });
      return c.json({ success: true, deletedAt: now });
    } catch (err: any) {
      return c.json({ success: false, error: err.message }, 500);
    }
  })

  // DELETE /api/documents/:id/hard - Hard Delete
  .delete('/:id/hard', async (c) => {
    try {
      if (!db) return c.json({ success: false, error: 'Database not configured' }, 500);
      const id = c.req.param('id');
      await db.execute({
        sql: 'DELETE FROM knowledge_bases WHERE id = ?',
        args: [id],
      });
      return c.json({ success: true });
    } catch (err: any) {
      return c.json({ success: false, error: err.message }, 500);
    }
  });
