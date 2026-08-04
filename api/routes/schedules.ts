import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { db } from '../db.js';

const createScheduleSchema = z.object({
  title: z.string().min(1, '日程名称不能为空'),
  startTime: z.number(),
  endTime: z.number(),
  room: z.string().default('线上会议室'),
  priority: z.enum(['高', '中', '低']).default('中'),
  attendees: z.array(z.string()).default([]),
  status: z.enum(['待开始', '进行中', '已结束']).default('待开始'),
});

const updateScheduleSchema = z.object({
  title: z.string().optional(),
  startTime: z.number().optional(),
  endTime: z.number().optional(),
  room: z.string().optional(),
  priority: z.enum(['高', '中', '低']).optional(),
  attendees: z.array(z.string()).optional(),
  status: z.enum(['待开始', '进行中', '已结束']).optional(),
});

export const schedulesRouter = new Hono()
  .get('/', async (c) => {
    try {
      if (!db) return c.json({ success: true, data: [] });
      const { rows } = await db.execute('SELECT * FROM schedule_events ORDER BY start_time ASC');
      const events = rows.map((r: any) => ({
        id: Number(r.id),
        title: r.title as string,
        startTime: Number(r.start_time),
        endTime: Number(r.end_time),
        room: r.room as string,
        priority: r.priority as string,
        attendees: JSON.parse((r.attendees as string) || '[]'),
        status: r.status as string,
      }));
      return c.json({ success: true, data: events });
    } catch (err: any) {
      return c.json({ success: false, error: err.message }, 500);
    }
  })
  .post('/', zValidator('json', createScheduleSchema), async (c) => {
    try {
      if (!db) return c.json({ success: false, error: 'Database not configured' }, 500);
      const event = c.req.valid('json');

      await db.execute({
        sql: 'INSERT INTO schedule_events (title, start_time, end_time, room, priority, attendees, status) VALUES (?, ?, ?, ?, ?, ?, ?)',
        args: [
          event.title, event.startTime, event.endTime, event.room,
          event.priority, JSON.stringify(event.attendees), event.status
        ]
      });

      return c.json({ success: true }, 201);
    } catch (err: any) {
      return c.json({ success: false, error: err.message }, 500);
    }
  })
  .patch('/:id', zValidator('json', updateScheduleSchema), async (c) => {
    try {
      if (!db) return c.json({ success: false, error: 'Database not configured' }, 500);
      const id = Number(c.req.param('id'));
      const updates = c.req.valid('json');
      const keys = Object.keys(updates);

      if (keys.length > 0) {
        const setClause = keys.map(k => {
          if (k === 'startTime') return 'start_time = ?';
          if (k === 'endTime') return 'end_time = ?';
          return `${k} = ?`;
        }).join(', ');

        const values = keys.map(k => k === 'attendees' ? JSON.stringify((updates as any)[k]) : (updates as any)[k]);

        await db.execute({
          sql: `UPDATE schedule_events SET ${setClause} WHERE id = ?`,
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
      if (!db) return c.json({ success: false, error: 'Database not configured' }, 500);
      const id = Number(c.req.param('id'));
      await db.execute({
        sql: 'DELETE FROM schedule_events WHERE id = ?',
        args: [id],
      });
      return c.json({ success: true });
    } catch (err: any) {
      return c.json({ success: false, error: err.message }, 500);
    }
  });
