import { Hono } from 'hono';
import { turso } from '../db';
import type { ScheduleEvent } from '../../src/lib/queries';

export const schedulesRoute = new Hono()
  .get('/', async (c) => {
    const { rows } = await turso.execute('SELECT * FROM schedule_events ORDER BY start_time ASC');
    const events: ScheduleEvent[] = rows.map((r: any) => ({
      id: Number(r.id),
      title: r.title as string,
      startTime: Number(r.start_time),
      endTime: Number(r.end_time),
      room: r.room as string,
      priority: r.priority as any,
      attendees: JSON.parse((r.attendees as string) || '[]'),
      status: r.status as any,
    }));
    return c.json(events);
  })
  .post('/', async (c) => {
    const event = await c.req.json<Omit<ScheduleEvent, 'id'>>();
    await turso.execute({
      sql: 'INSERT INTO schedule_events (title, start_time, end_time, room, priority, attendees, status) VALUES (?, ?, ?, ?, ?, ?, ?)',
      args: [
        event.title,
        event.startTime,
        event.endTime,
        event.room,
        event.priority,
        JSON.stringify(event.attendees),
        event.status,
      ],
    });
    return c.json({ success: true });
  })
  .patch('/:id', async (c) => {
    const id = Number(c.req.param('id'));
    const updates = await c.req.json<Partial<ScheduleEvent>>();
    const keys = Object.keys(updates);
    if (keys.length === 0) return c.json({ success: true });

    const setClause = keys
      .map((k) => {
        if (k === 'startTime') return 'start_time = ?';
        if (k === 'endTime') return 'end_time = ?';
        return `${k} = ?`;
      })
      .join(', ');

    const values = keys.map((k) => (k === 'attendees' ? JSON.stringify((updates as any)[k]) : (updates as any)[k]));

    await turso.execute({
      sql: `UPDATE schedule_events SET ${setClause} WHERE id = ?`,
      args: [...values, id],
    });
    return c.json({ success: true });
  })
  .delete('/:id', async (c) => {
    const id = Number(c.req.param('id'));
    await turso.execute({
      sql: 'DELETE FROM schedule_events WHERE id = ?',
      args: [id],
    });
    return c.json({ success: true });
  });
