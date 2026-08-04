import { Hono } from 'hono';
import { turso } from '../db';
import type { FileDoc } from '../../src/types';

export const filesRoute = new Hono()
  .get('/', async (c) => {
    const { rows } = await turso.execute('SELECT * FROM files ORDER BY updated_at DESC');
    const files: FileDoc[] = rows.map((r: any) => ({
      id: r.id as string,
      title: r.title as string,
      category: r.category as string,
      size: r.size as string,
      author: r.author as string,
      updatedAt: Number(r.updated_at),
      completion: Number(r.completion),
      tags: JSON.parse((r.tags as string) || '[]'),
    }));
    return c.json(files);
  })
  .post('/', async (c) => {
    const file = await c.req.json<Partial<FileDoc>>();
    const id = `doc-${Date.now()}`;
    const tags = JSON.stringify(file.tags || ['新增']);

    await turso.execute({
      sql: 'INSERT INTO files (id, title, category, size, author, updated_at, completion, tags) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      args: [
        id,
        file.title || '未命名文档',
        file.category || '通用文档',
        file.size || '1.2 MB',
        file.author || 'Brandon',
        file.updatedAt || Date.now(),
        file.completion || 100,
        tags,
      ],
    });
    return c.json({ success: true, id });
  });
