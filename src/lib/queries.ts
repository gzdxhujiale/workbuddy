import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { turso } from './db';
import { apiClient } from './api-client';
import { TaskItem, KnowledgeBase } from '@/types';

// Helper to safely fetch JSON without throwing SyntaxError on HTML fallbacks in dev mode
async function safeFetchJson<T = any>(fn: () => Promise<Response>): Promise<T | null> {
  try {
    const res = await fn();
    if (res && res.ok) {
      const contentType = res.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        const json = await res.json();
        if (json && json.success) {
          return (json.data !== undefined ? json.data : json) as T;
        }
      }
    }
  } catch (e) {
    // Silent fallback to direct Turso DB
  }
  return null;
}

// Workspaces
export function useWorkspaces() {
  return useQuery({
    queryKey: ['workspaces'],
    queryFn: async () => {
      const data = await safeFetchJson<string[]>(() => apiClient.api.workspaces.$get());
      if (data) return data;

      const { rows } = await turso.execute('SELECT * FROM workspaces');
      return rows.map((r: any) => r.name as string);
    },
  });
}

export function useAddWorkspace() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (name: string) => {
      const data = await safeFetchJson(() => apiClient.api.workspaces.$post({ json: { name } }));
      if (data) return name;

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
      const data = await safeFetchJson<TaskItem[]>(() => apiClient.api.tasks.$get());
      if (data) return data;

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
      if (task.title) {
        const data = await safeFetchJson<{ id: string }>(() =>
          apiClient.api.tasks.$post({
            json: {
              title: task.title!,
              priority: (task.priority as any) || '中',
              status: (task.status as any) || '进行中',
              phase: task.phase || '需求评审',
              project: task.project || '通用空间',
              description: task.description || '',
              completionProgress: task.completionProgress || 0,
              deadline: task.deadline,
              tags: task.tags,
              assignee: task.assignee,
            },
          })
        );
        if (data && data.id) return data.id;
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
      const data = await safeFetchJson(() =>
        apiClient.api.tasks[':id'].$patch({
          param: { id },
          json: {
            title: updates.title,
            priority: updates.priority as any,
            phase: updates.phase,
            project: updates.project,
            description: updates.description,
            tags: updates.tags,
            assignee: updates.assignee,
          },
        })
      );
      if (data) return;

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
      const data = await safeFetchJson(() => apiClient.api.tasks[':id'].$delete({ param: { id } }));
      if (data) return;

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

// Knowledge Base Documents
export function useKnowledgeBases() {
  return useQuery({
    queryKey: ['knowledge_bases'],
    queryFn: async () => {
      const data = await safeFetchJson<KnowledgeBase[]>(() => apiClient.api.documents.$get());
      if (data) return data;

      const { rows } = await turso.execute(
        'SELECT * FROM knowledge_bases WHERE deleted_at IS NULL ORDER BY sort_order ASC, updated_at DESC'
      );
      return rows.map((r: any) => ({
        id: r.id as string,
        title: r.title as string,
        sortOrder: Number(r.sort_order || 0),
        category: r.category ? (r.category as string) : null,
        content: (r.content as string) || '',
        updatedAt: Number(r.updated_at),
        deletedAt: r.deleted_at ? Number(r.deleted_at) : null,
      })) as KnowledgeBase[];
    },
  });
}

export function useAddKnowledgeBase() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (doc: Partial<KnowledgeBase>) => {
      if (doc.title) {
        const data = await safeFetchJson<{ id: string }>(() =>
          apiClient.api.documents.$post({
            json: {
              title: doc.title!,
              category: doc.category || null,
              content: doc.content || '',
              sortOrder: doc.sortOrder ?? 0,
            },
          })
        );
        if (data && data.id) return data.id;
      }

      const id = `kb-${Date.now()}`;
      const now = Date.now();
      const cat = doc.category || null;

      await turso.execute({
        sql: 'INSERT INTO knowledge_bases (id, title, sort_order, category, content, updated_at, deleted_at) VALUES (?, ?, ?, ?, ?, ?, NULL)',
        args: [id, doc.title || '无标题文档', doc.sortOrder ?? 0, cat, doc.content || '', now],
      });
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['knowledge_bases'] });
    },
  });
}

export function useUpdateKnowledgeBase() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...doc }: Partial<KnowledgeBase> & { id: string }) => {
      const data = await safeFetchJson(() =>
        apiClient.api.documents[':id'].$put({
          param: { id },
          json: {
            title: doc.title,
            category: doc.category !== undefined ? doc.category : undefined,
            content: doc.content,
            sortOrder: doc.sortOrder,
          },
        })
      );
      if (data) return;

      const now = Date.now();
      const existingRes = await turso.execute({
        sql: 'SELECT * FROM knowledge_bases WHERE id = ? AND deleted_at IS NULL',
        args: [id],
      });
      if (existingRes.rows.length === 0) return;
      const existing = existingRes.rows[0];

      const newTitle = doc.title !== undefined ? doc.title : existing.title;
      const newCategory = doc.category !== undefined ? doc.category : existing.category;
      const newContent = doc.content !== undefined ? doc.content : existing.content;
      const newSortOrder = doc.sortOrder !== undefined ? doc.sortOrder : existing.sort_order;

      await turso.execute({
        sql: 'UPDATE knowledge_bases SET title = ?, category = ?, content = ?, sort_order = ?, updated_at = ? WHERE id = ?',
        args: [newTitle, newCategory, newContent, newSortOrder, now, id],
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['knowledge_bases'] });
    },
  });
}

export function useSoftDeleteKnowledgeBase() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const now = Date.now();
      await turso.execute({
        sql: 'UPDATE knowledge_bases SET deleted_at = ? WHERE id = ?',
        args: [now, id],
      });

      // Optionally notify backend API in background
      safeFetchJson(() =>
        apiClient.api.documents[':id'].$delete({
          param: { id },
        })
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['knowledge_bases'] });
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
      const data = await safeFetchJson<ScheduleEvent[]>(() => apiClient.api.schedules.$get());
      if (data) return data;

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
      const data = await safeFetchJson(() =>
        apiClient.api.schedules.$post({
          json: {
            title: event.title,
            startTime: event.startTime,
            endTime: event.endTime,
            room: event.room,
            priority: event.priority as any,
            attendees: event.attendees,
            status: event.status as any,
          },
        })
      );
      if (data) return;

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
      const data = await safeFetchJson(() =>
        apiClient.api.schedules[':id'].$patch({
          param: { id: String(id) },
          json: {
            title: updates.title,
            startTime: updates.startTime,
            endTime: updates.endTime,
            room: updates.room,
            priority: updates.priority as any,
            attendees: updates.attendees,
            status: updates.status as any,
          },
        })
      );
      if (data) return;

      const keys = Object.keys(updates);
      if (keys.length === 0) return;

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
      const data = await safeFetchJson(() =>
        apiClient.api.schedules[':id'].$delete({
          param: { id: String(id) },
        })
      );
      if (data) return;

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
