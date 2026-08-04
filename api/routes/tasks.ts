import { Hono } from 'hono';
import { turso } from '../db';
import type { TaskItem } from '../../src/types';

export const tasksRoute = new Hono()
  .get('/', async (c) => {
    const { rows } = await turso.execute('SELECT * FROM tasks ORDER BY priority DESC, deadline ASC');
    const tasks: TaskItem[] = rows.map((r: any) => ({
      id: r.id as string,
      title: r.title as string,
      priority: r.priority as any,
      status: r.status as any,
      createdAt: Number(r.created_at),
      phase: r.phase as any,
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
    return c.json(tasks);
  })
  .post('/', async (c) => {
    const task = await c.req.json<Partial<TaskItem>>();
    const id = task.id || `WXB-2025-${Math.floor(Math.random() * 900) + 100}`;
    const tags = JSON.stringify(task.tags || ['新任务']);
    const aiSuggestions = JSON.stringify(task.aiSuggestions || []);
    const assignee = task.assignee || { name: 'Brandon', avatar: 'BR', role: '产品经理' };

    await turso.execute({
      sql: `INSERT INTO tasks (
        id, title, priority, status, created_at, phase, assignee_name, assignee_avatar, assignee_role,
        project, deadline, description, tags, ai_suggestions, completion_progress
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [
        id,
        task.title || '新建任务',
        task.priority || '中',
        task.status || '进行中',
        task.createdAt || Date.now(),
        task.phase || '需求评审',
        assignee.name,
        assignee.avatar,
        assignee.role,
        task.project || '通用空间',
        task.deadline || Date.now() + 86400000,
        task.description || '',
        tags,
        aiSuggestions,
        task.completionProgress || 0,
      ],
    });
    return c.json({ success: true, id });
  })
  .patch('/:id', async (c) => {
    const id = c.req.param('id');
    const updates = await c.req.json<Partial<TaskItem>>();

    if (updates.status) {
      await turso.execute({
        sql: 'UPDATE tasks SET status = ? WHERE id = ?',
        args: [updates.status, id],
      });
    }
    if (updates.completionProgress !== undefined) {
      await turso.execute({
        sql: 'UPDATE tasks SET completion_progress = ? WHERE id = ?',
        args: [updates.completionProgress, id],
      });
    }
    if (updates.deadline) {
      await turso.execute({
        sql: 'UPDATE tasks SET deadline = ? WHERE id = ?',
        args: [updates.deadline, id],
      });
    }
    return c.json({ success: true });
  })
  .delete('/:id', async (c) => {
    const id = c.req.param('id');
    await turso.execute({
      sql: 'DELETE FROM tasks WHERE id = ?',
      args: [id],
    });
    return c.json({ success: true });
  });
