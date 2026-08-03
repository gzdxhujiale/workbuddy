import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { turso } from './db';
import { TaskItem, FileDoc } from '@/types';

// Workspaces
export function useWorkspaces() {
  return useQuery({
    queryKey: ['workspaces'],
    queryFn: async () => {
      const { rows } = await turso.execute('SELECT * FROM workspaces');
      return rows.map((r: any) => r.name as string);
    },
  });
}

export function useAddWorkspace() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (name: string) => {
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

// Files
export function useFiles() {
  return useQuery({
    queryKey: ['files'],
    queryFn: async () => {
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
