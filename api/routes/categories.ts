import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { db } from '../db.js';

const createCategorySchema = z.object({
  name: z.string().min(1, '分类名不能为空'),
  sortOrder: z.number().optional().default(0),
});

const updateCategorySchema = z.object({
  name: z.string().optional(),
  sortOrder: z.number().optional(),
});

const batchReorderSchema = z.object({
  items: z.array(
    z.object({
      id: z.string(),
      sortOrder: z.number(),
    })
  ),
});

export const categoriesRouter = new Hono()
  // GET /api/categories - List all non-deleted categories
  .get('/', async (c) => {
    try {
      if (!db) return c.json({ success: true, data: [] });
      const { rows } = await db.execute(
        'SELECT * FROM knowledge_categories WHERE deleted_at IS NULL ORDER BY sort_order ASC, updated_at DESC'
      );
      const categories = rows.map((r: any) => ({
        id: r.id as string,
        name: r.name as string,
        sortOrder: Number(r.sort_order || 0),
        updatedAt: Number(r.updated_at),
        deletedAt: r.deleted_at ? Number(r.deleted_at) : null,
      }));
      return c.json({ success: true, data: categories });
    } catch (err: any) {
      return c.json({ success: false, error: err.message }, 500);
    }
  })

  // POST /api/categories - Create category
  .post('/', zValidator('json', createCategorySchema), async (c) => {
    try {
      if (!db) return c.json({ success: false, error: 'Database not configured' }, 500);
      const data = c.req.valid('json');
      const id = `cat-${Date.now()}`;
      const now = Date.now();

      await db.execute({
        sql: 'INSERT INTO knowledge_categories (id, name, sort_order, updated_at, deleted_at) VALUES (?, ?, ?, ?, NULL)',
        args: [id, data.name, data.sortOrder ?? 0, now],
      });

      return c.json({ success: true, data: { id, name: data.name, sortOrder: data.sortOrder ?? 0, updatedAt: now } }, 201);
    } catch (err: any) {
      return c.json({ success: false, error: err.message }, 500);
    }
  })

  // POST /api/categories/reorder - Batch reorder categories
  .post('/reorder', zValidator('json', batchReorderSchema), async (c) => {
    try {
      if (!db) return c.json({ success: false, error: 'Database not configured' }, 500);
      const { items } = c.req.valid('json');
      const now = Date.now();

      for (const item of items) {
        await db.execute({
          sql: 'UPDATE knowledge_categories SET sort_order = ?, updated_at = ? WHERE id = ?',
          args: [item.sortOrder, now, item.id],
        });
      }

      return c.json({ success: true });
    } catch (err: any) {
      return c.json({ success: false, error: err.message }, 500);
    }
  })

  // PUT /api/categories/:id - Update category
  .put('/:id', zValidator('json', updateCategorySchema), async (c) => {
    try {
      if (!db) return c.json({ success: false, error: 'Database not configured' }, 500);
      const id = c.req.param('id');
      const data = c.req.valid('json');
      const now = Date.now();

      const existingRes = await db.execute({
        sql: 'SELECT * FROM knowledge_categories WHERE id = ? AND deleted_at IS NULL',
        args: [id],
      });

      if (existingRes.rows.length === 0) {
        return c.json({ success: false, error: 'Category not found' }, 404);
      }

      const existing = existingRes.rows[0];
      const newName = data.name !== undefined ? data.name : existing.name;
      const newSortOrder = data.sortOrder !== undefined ? data.sortOrder : existing.sort_order;

      await db.execute({
        sql: 'UPDATE knowledge_categories SET name = ?, sort_order = ?, updated_at = ? WHERE id = ?',
        args: [newName, newSortOrder, now, id],
      });

      return c.json({ success: true, updatedAt: now });
    } catch (err: any) {
      return c.json({ success: false, error: err.message }, 500);
    }
  })

  // DELETE /api/categories/:id - Soft Delete Category & Clear category_id in documents
  .delete('/:id', async (c) => {
    try {
      if (!db) return c.json({ success: false, error: 'Database not configured' }, 500);
      const id = c.req.param('id');
      const now = Date.now();

      // Soft delete category
      await db.execute({
        sql: 'UPDATE knowledge_categories SET deleted_at = ? WHERE id = ?',
        args: [now, id],
      });

      // Clear category_id for documents under this category
      await db.execute({
        sql: 'UPDATE knowledge_bases SET category_id = NULL, updated_at = ? WHERE category_id = ? AND deleted_at IS NULL',
        args: [now, id],
      });

      return c.json({ success: true, deletedAt: now });
    } catch (err: any) {
      return c.json({ success: false, error: err.message }, 500);
    }
  });
