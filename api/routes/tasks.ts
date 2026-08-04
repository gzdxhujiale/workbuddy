import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { db } from '../db.js';

const createTaskSchema = z.object({
  title: z.string().min(1, '标题不能为空'),
  priority: z.enum(['高', '中', '低']).default('中'),
  status: z.enum(['进行中', '未开始', '已完成', '评审中']).default('进行中'),
  phase: z.string().default('需求评审'),
  project: z.string().default('通用空间'),
  description: z.string().optional().default(''),
  completionProgress: z.number().optional().default(0),
  deadline: z.number().optional(),
  tags: z.array(z.string()).optional(),
  assignee: z.object({
    name: z.string(),
    avatar: z.string(),
    role: z.string(),
  }).optional(),
});

const updateTaskSchema = z.object({
  title: z.string().optional(),
  priority: z.enum(['高', '中', '低']).optional(),
  status: z.enum(['进行中', '未开始', '已完成', '评审中']).optional(),
  phase: z.string().optional(),
  project: z.string().optional(),
  description: z.string().optional(),
  completionProgress: z.number().optional(),
  deadline: z.number().optional(),
  tags: z.array(z.string()).optional(),
  assignee: z.object({
    name: z.string(),
    avatar: z.string(),
    role: z.string(),
  }).optional(),
});

export const tasksRouter = new Hono()
  .get('/', async (c) => {
    try {
      if (!db) return c.json({ success: true, data: [] });
      const { rows } = await db.execute('SELECT * FROM tasks ORDER BY priority DESC, deadline ASC');
      const tasks = rows.map((r: any) => ({
        id: r.id as string,
        title: r.title as string,
        priority: r.priority as string,
        status: r.status as string,
        createdAt: Number(r.created_at),
        phase: r.phase as string,
        assignee: {
          name: r.assignee_name as string,
          avatar: r.assignee_avatar as string,
          role: r.assignee_role as string,
        },
        project: r.project as string,
        deadline: Number(r.deadline),
        description: r.description as string,
        tags: JSON.parse((r.tags as string) || '[]'),
        aiSuggestions: JSON.parse((r.ai_suggestions as string) || '[]'),
        completionProgress: Number(r.completion_progress),
      }));
      return c.json({ success: true, data: tasks });
    } catch (err: any) {
      return c.json({ success: false, error: err.message }, 500);
    }
  })
  .post('/', zValidator('json', createTaskSchema), async (c) => {
    try {
      if (!db) return c.json({ success: false, error: 'Database not configured' }, 500);
      const task = c.req.valid('json');
      const id = `WXB-${new Date().getFullYear()}-${Math.floor(Math.random() * 900) + 100}`;
      const now = Date.now();
      const tags = JSON.stringify(task.tags || ['新任务']);
      const aiSuggestions = JSON.stringify([]);
      const assignee = task.assignee || { name: 'Brandon', avatar: 'BR', role: '产品经理' };

      await db.execute({
        sql: `INSERT INTO tasks (
          id, title, priority, status, created_at, phase, assignee_name, assignee_avatar, assignee_role,
          project, deadline, description, tags, ai_suggestions, completion_progress
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        args: [
          id, task.title, task.priority, task.status, now,
          task.phase, assignee.name, assignee.avatar, assignee.role, task.project,
          task.deadline || now + 86400000, task.description, tags, aiSuggestions, task.completionProgress
        ]
      });

      return c.json({ success: true, id }, 201);
    } catch (err: any) {
      return c.json({ success: false, error: err.message }, 500);
    }
  })
  .patch('/:id', zValidator('json', updateTaskSchema), async (c) => {
    try {
      if (!db) return c.json({ success: false, error: 'Database not configured' }, 500);
      const id = c.req.param('id');
      const updates = c.req.valid('json');
      const keys = Object.keys(updates) as (keyof typeof updates)[];

      if (keys.length > 0) {
        const fields: string[] = [];
        const args: any[] = [];

        for (const k of keys) {
          const val = updates[k];
          if (val === undefined) continue;

          if (k === 'completionProgress') {
            fields.push('completion_progress = ?');
            args.push(val);
          } else if (k === 'tags') {
            fields.push('tags = ?');
            args.push(JSON.stringify(val));
          } else if (k === 'assignee') {
            const assignee = val as any;
            fields.push('assignee_name = ?, assignee_avatar = ?, assignee_role = ?');
            args.push(assignee.name, assignee.avatar, assignee.role);
          } else {
            fields.push(`${k} = ?`);
            args.push(val);
          }
        }

        if (fields.length > 0) {
          await db.execute({
            sql: `UPDATE tasks SET ${fields.join(', ')} WHERE id = ?`,
            args: [...args, id],
          });
        }
      }

      return c.json({ success: true });
    } catch (err: any) {
      return c.json({ success: false, error: err.message }, 500);
    }
  })
  .delete('/:id', async (c) => {
    try {
      if (!db) return c.json({ success: false, error: 'Database not configured' }, 500);
      const id = c.req.param('id');
      await db.execute({
        sql: 'DELETE FROM tasks WHERE id = ?',
        args: [id],
      });
      return c.json({ success: true });
    } catch (err: any) {
      return c.json({ success: false, error: err.message }, 500);
    }
  });
