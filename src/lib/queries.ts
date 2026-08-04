import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { turso } from './db';
import { apiClient } from './api-client';
import { TaskItem, FileDoc } from '@/types';

// Workspaces
export function useWorkspaces() {
  return useQuery({
    queryKey: ['workspaces'],
    queryFn: async () => {
      try {
        const res = await apiClient.api.workspaces.$get();
        if (res.ok) {
          const json = await res.json();
          if (json.success && json.data) return json.data;
        }
      } catch (e) {
        console.warn('Hono API fetch workspaces failed, fallback to direct DB:', e);
      }
      const { rows } = await turso.execute('SELECT * FROM workspaces');
      return rows.map((r: any) => r.name as string);
    },
  });
}

export function useAddWorkspace() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (name: string) => {
      try {
        const res = await apiClient.api.workspaces.$post({ json: { name } });
        if (res.ok) {
          const json = await res.json();
          if (json.success) return name;
        }
      } catch (e) {
        console.warn('Hono API add workspace failed, fallback to direct DB:', e);
      }
      const id = `ws-${Date.now()}-${Math.random().toString(36).substring(7)}`;
      await turso.execute({
        sql: 'INSERT INTO workspaces (id, name) VALUES (?, ?)',
        args: [id, name],
      });
      return name;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workspaces'] });
    },
  });
}

// Tasks
export function useTasks() {
  return useQuery({
    queryKey: ['tasks'],
    queryFn: async () => {
      try {
        const res = await apiClient.api.tasks.$get();
        if (res.ok) {
          const json = await res.json();
          if (json.success && json.data) return json.data as TaskItem[];
        }
      } catch (e) {
        console.warn('Hono API fetch tasks failed, fallback to direct DB:', e);
      }
      const { rows } = await turso.execute('SELECT * FROM tasks ORDER BY priority DESC, deadline ASC');
      return rows.map((r: any) => ({
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
      })) as TaskItem[];
    },
  });
}

export function useAddTask() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (task: Partial<TaskItem>) => {
      try {
        if (task.title) {
          const res = await apiClient.api.tasks.$post({
            json: {
              title: task.title,
              priority: (task.priority as any) || '中',
              status: (task.status as any) || '进行中',
              phase: task.phase || '需求评审',
              project: task.project || '通用空间',
              description: task.description || '',
              completionProgress: task.completionProgress || 0,
              deadline: task.deadline,
              tags: task.tags,
              assignee: task.assignee,
            }
          });
          if (res.ok) {
            const json = await res.json();
            if (json.success) return json.id;
          }
        }
      } catch (e) {
        console.warn('Hono API add task failed, fallback to direct DB:', e);
      }

      const id = task.id || `WXB-${new Date().getFullYear()}-${Math.floor(Math.random() * 900) + 100}`;
      const tags = JSON.stringify(task.tags || ['新任务']);
      const aiSuggestions = JSON.stringify(task.aiSuggestions || []);
      const assignee = task.assignee || { name: 'Brandon', avatar: 'BR', role: '产品经理' };
      
      await turso.execute({
        sql: `INSERT INTO tasks (
          id, title, priority, status, created_at, phase, assignee_name, assignee_avatar, assignee_role,
          project, deadline, description, tags, ai_suggestions, completion_progress
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        args: [
          id, task.title || '新建任务', task.priority || '中', task.status || '进行中', task.createdAt || Date.now(),
          task.phase || '需求评审', assignee.name, assignee.avatar, assignee.role, task.project || '通用空间',
          task.deadline || Date.now() + 86400000, task.description || '', tags, aiSuggestions, task.completionProgress || 0
        ]
      });
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
  });
}

export function useUpdateTask() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<TaskItem> }) => {
      try {
        const res = await apiClient.api.tasks[':id'].$patch({
          param: { id },
          json: {
            status: updates.status as any,
            completionProgress: updates.completionProgress,
            deadline: updates.deadline,
            title: updates.title,
            priority: updates.priority as any,
            phase: updates.phase,
            project: updates.project,
            description: updates.description,
            tags: updates.tags,
            assignee: updates.assignee,
          }
        });
        if (res.ok) {
          const json = await res.json();
          if (json.success) return;
        }
      } catch (e) {
        console.warn('Hono API update task failed, fallback to direct DB:', e);
      }

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
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
  });
}

export function useDeleteTask() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      try {
        const res = await apiClient.api.tasks[':id'].$delete({ param: { id } });
        if (res.ok) return;
      } catch (e) {
        console.warn('Hono API delete task failed, fallback to direct DB:', e);
      }
      await turso.execute({
        sql: 'DELETE FROM tasks WHERE id = ?',
        args: [id],
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
  });
}

// Files / Documents
export function useFiles() {
  return useQuery({
    queryKey: ['files'],
    queryFn: async () => {
      try {
        const res = await apiClient.api.documents.$get();
        if (res.ok) {
          const json = await res.json();
          if (json.success && json.data) return json.data as FileDoc[];
        }
      } catch (e) {
        console.warn('Hono API fetch documents failed, fallback to direct DB:', e);
      }
      const { rows } = await turso.execute('SELECT * FROM files ORDER BY updated_at DESC');
      return rows.map((r: any) => ({
        id: r.id as string,
        title: r.title as string,
        category: r.category as string,
        size: r.size as string,
        author: r.author as string,
        updatedAt: Number(r.updated_at),
        completion: Number(r.completion),
        tags: JSON.parse((r.tags as string) || '[]'),
      })) as FileDoc[];
    },
  });
}

export function useAddFile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (file: Partial<FileDoc>) => {
      try {
        if (file.title) {
          const res = await apiClient.api.documents.$post({
            json: {
              title: file.title,
              category: file.category || '通用文档',
              size: file.size || '1.2 MB',
              author: file.author || 'Brandon',
              completion: file.completion || 100,
              tags: file.tags,
            }
          });
          if (res.ok) {
            const json = await res.json();
            if (json.success) return json.id;
          }
        }
      } catch (e) {
        console.warn('Hono API add file failed, fallback to direct DB:', e);
      }

      const id = `doc-${Date.now()}`;
      const tags = JSON.stringify(file.tags || ['新增']);
      
      await turso.execute({
        sql: 'INSERT INTO files (id, title, category, size, author, updated_at, completion, tags) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        args: [
          id, file.title || '未命名文档', file.category || '通用文档', file.size || '1.2 MB', 
          file.author || 'Brandon', file.updatedAt || Date.now(), 
          file.completion || 100, tags
        ]
      });
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['files'] });
    },
  });
}

export interface ScheduleEvent {
  id: number;
  title: string;
  startTime: number;
  endTime: number;
  room: string;
  priority: '高' | '中' | '低';
  attendees: string[];
  status: '待开始' | '进行中' | '已结束';
}

// Schedule Events
export function useScheduleEvents() {
  return useQuery({
    queryKey: ['schedule_events'],
    queryFn: async () => {
      try {
        const res = await apiClient.api.schedules.$get();
        if (res.ok) {
          const json = await res.json();
          if (json.success && json.data) return json.data as ScheduleEvent[];
        }
      } catch (e) {
        console.warn('Hono API fetch schedules failed, fallback to direct DB:', e);
      }
      const { rows } = await turso.execute('SELECT * FROM schedule_events ORDER BY start_time ASC');
      return rows.map((r: any) => ({
        id: Number(r.id),
        title: r.title as string,
        startTime: Number(r.start_time),
        endTime: Number(r.end_time),
        room: r.room as string,
        priority: r.priority as any,
        attendees: JSON.parse((r.attendees as string) || '[]'),
        status: r.status as any,
      })) as ScheduleEvent[];
    },
  });
}

export function useAddScheduleEvent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (event: Omit<ScheduleEvent, 'id'>) => {
      try {
        const res = await apiClient.api.schedules.$post({
          json: {
            title: event.title,
            startTime: event.startTime,
            endTime: event.endTime,
            room: event.room,
            priority: event.priority as any,
            attendees: event.attendees,
            status: event.status as any,
          }
        });
        if (res.ok) return;
      } catch (e) {
        console.warn('Hono API add schedule failed, fallback to direct DB:', e);
      }

      await turso.execute({
        sql: 'INSERT INTO schedule_events (title, start_time, end_time, room, priority, attendees, status) VALUES (?, ?, ?, ?, ?, ?, ?)',
        args: [
          event.title, event.startTime, event.endTime, event.room,
          event.priority, JSON.stringify(event.attendees), event.status
        ]
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['schedule_events'] });
    },
  });
}

export function useUpdateScheduleEvent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, updates }: { id: number; updates: Partial<ScheduleEvent> }) => {
      try {
        const res = await apiClient.api.schedules[':id'].$patch({
          param: { id: String(id) },
          json: {
            title: updates.title,
            startTime: updates.startTime,
            endTime: updates.endTime,
            room: updates.room,
            priority: updates.priority as any,
            attendees: updates.attendees,
            status: updates.status as any,
          }
        });
        if (res.ok) return;
      } catch (e) {
        console.warn('Hono API update schedule failed, fallback to direct DB:', e);
      }

      const keys = Object.keys(updates);
      if (keys.length === 0) return;
      
      const setClause = keys.map(k => {
        if (k === 'startTime') return 'start_time = ?';
        if (k === 'endTime') return 'end_time = ?';
        return `${k} = ?`;
      }).join(', ');
      
      const values = keys.map(k => k === 'attendees' ? JSON.stringify((updates as any)[k]) : (updates as any)[k]);
      
      await turso.execute({
        sql: `UPDATE schedule_events SET ${setClause} WHERE id = ?`,
        args: [...values, id],
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['schedule_events'] });
    },
  });
}

export function useDeleteScheduleEvent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      try {
        const res = await apiClient.api.schedules[':id'].$delete({
          param: { id: String(id) }
        });
        if (res.ok) return;
      } catch (e) {
        console.warn('Hono API delete schedule failed, fallback to direct DB:', e);
      }

      await turso.execute({
        sql: 'DELETE FROM schedule_events WHERE id = ?',
        args: [id],
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['schedule_events'] });
    },
  });
}
