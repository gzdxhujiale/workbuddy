import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { client } from './api-client';
import { TaskItem, FileDoc } from '@/types';

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

// Workspaces
export function useWorkspaces() {
  return useQuery({
    queryKey: ['workspaces'],
    queryFn: async () => {
      const res = await client.api.workspaces.$get();
      if (!res.ok) throw new Error('Failed to fetch workspaces');
      return await res.json();
    },
  });
}

export function useAddWorkspace() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (name: string) => {
      const res = await client.api.workspaces.$post({ json: { name } });
      if (!res.ok) throw new Error('Failed to add workspace');
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
      const res = await client.api.tasks.$get();
      if (!res.ok) throw new Error('Failed to fetch tasks');
      return (await res.json()) as TaskItem[];
    },
  });
}

export function useAddTask() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (task: Partial<TaskItem>) => {
      const res = await client.api.tasks.$post({ json: task });
      if (!res.ok) throw new Error('Failed to add task');
      const data = await res.json();
      return data.id;
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
      const res = await client.api.tasks[':id'].$patch({
        param: { id },
        json: updates,
      } as any);
      if (!res.ok) throw new Error('Failed to update task');
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
      const res = await client.api.tasks[':id'].$delete({
        param: { id },
      });
      if (!res.ok) throw new Error('Failed to delete task');
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
      const res = await client.api.files.$get();
      if (!res.ok) throw new Error('Failed to fetch files');
      return (await res.json()) as FileDoc[];
    },
  });
}

export function useAddFile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (file: Partial<FileDoc>) => {
      const res = await client.api.files.$post({ json: file });
      if (!res.ok) throw new Error('Failed to add file');
      const data = await res.json();
      return data.id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['files'] });
    },
  });
}

// Schedule Events
export function useScheduleEvents() {
  return useQuery({
    queryKey: ['schedule_events'],
    queryFn: async () => {
      const res = await client.api.schedules.$get();
      if (!res.ok) throw new Error('Failed to fetch schedule events');
      return (await res.json()) as ScheduleEvent[];
    },
  });
}

export function useAddScheduleEvent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (event: Omit<ScheduleEvent, 'id'>) => {
      const res = await client.api.schedules.$post({ json: event });
      if (!res.ok) throw new Error('Failed to add schedule event');
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
      const res = await client.api.schedules[':id'].$patch({
        param: { id: String(id) },
        json: updates,
      } as any);
      if (!res.ok) throw new Error('Failed to update schedule event');
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
      const res = await client.api.schedules[':id'].$delete({
        param: { id: String(id) },
      });
      if (!res.ok) throw new Error('Failed to delete schedule event');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['schedule_events'] });
    },
  });
}
