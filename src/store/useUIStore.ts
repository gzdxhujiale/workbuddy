import { create } from 'zustand';
import { TaskItem, CardDeckItem } from '@/types';
import confetti from 'canvas-confetti';

interface UIState {
  accentColor: 'emerald' | 'cyan' | 'purple';
  setAccentColor: (color: 'emerald' | 'cyan' | 'purple') => void;

  glassBlur: 'standard' | 'ultra' | 'max';
  setGlassBlur: (blur: 'standard' | 'ultra' | 'max') => void;

  enableConfetti: boolean;
  setEnableConfetti: (val: boolean) => void;
  triggerConfetti: () => void;

  isNewTaskOpen: boolean;
  setIsNewTaskOpen: (val: boolean) => void;

  isCreateDocOpen: boolean;
  setIsCreateDocOpen: (val: boolean) => void;

  isCreateScheduleOpen: boolean;
  setIsCreateScheduleOpen: (val: boolean) => void;

  isInviteMemberOpen: boolean;
  setIsInviteMemberOpen: (val: boolean) => void;

  editingTask: TaskItem | null;
  setEditingTask: (task: TaskItem | null) => void;

  selectedTask: TaskItem | null;
  setSelectedTask: (task: TaskItem | null) => void;

  selectedDoc: CardDeckItem | null;
  setSelectedDoc: (doc: CardDeckItem | null) => void;

  currentWorkspace: string;
  setCurrentWorkspace: (ws: string) => void;
}

export const useUIStore = create<UIState>((set, get) => ({
  accentColor: 'emerald',
  setAccentColor: (color) => set({ accentColor: color }),

  glassBlur: 'ultra',
  setGlassBlur: (blur) => set({ glassBlur: blur }),

  enableConfetti: true,
  setEnableConfetti: (val) => set({ enableConfetti: val }),
  triggerConfetti: () => {
    if (get().enableConfetti) {
      confetti({ particleCount: 70, spread: 70, origin: { x: 0.85, y: 0.6 } });
    }
  },

  isNewTaskOpen: false,
  setIsNewTaskOpen: (val) => set({ isNewTaskOpen: val }),

  isCreateDocOpen: false,
  setIsCreateDocOpen: (val) => set({ isCreateDocOpen: val }),

  isCreateScheduleOpen: false,
  setIsCreateScheduleOpen: (val) => set({ isCreateScheduleOpen: val }),

  isInviteMemberOpen: false,
  setIsInviteMemberOpen: (val) => set({ isInviteMemberOpen: val }),

  editingTask: null,
  setEditingTask: (task) => set({ editingTask: task }),

  selectedTask: null,
  setSelectedTask: (task) => set({ selectedTask: task }),

  selectedDoc: null,
  setSelectedDoc: (doc) => set({ selectedDoc: doc }),

  currentWorkspace: '产品研发中心',
  setCurrentWorkspace: (ws) => set({ currentWorkspace: ws }),
}));
