import React, { createContext, useContext, useState } from 'react';
import { TaskItem, FileDoc, CardDeckItem, Priority, TaskStatus } from '@/types';
import confetti from 'canvas-confetti';

interface AppContextType {
  // Tasks state
  tasks: TaskItem[];
  selectedTask: TaskItem;
  setSelectedTask: (task: TaskItem) => void;
  addTask: (task: Partial<TaskItem>) => void;
  updateTask: (taskId: string, updates: Partial<TaskItem>) => void;
  completeTask: (taskId: string) => void;
  deleteTask: (taskId: string) => void;

  // Workspace
  currentWorkspace: string;
  setCurrentWorkspace: (ws: string) => void;
  workspaces: string[];
  addWorkspace: (name: string) => void;

  // Documents
  files: FileDoc[];
  addFile: (file: Partial<FileDoc>) => void;

  // Settings / Theme
  accentColor: 'emerald' | 'cyan' | 'purple';
  setAccentColor: (color: 'emerald' | 'cyan' | 'purple') => void;
  glassBlur: 'standard' | 'ultra' | 'max';
  setGlassBlur: (blur: 'standard' | 'ultra' | 'max') => void;
  enableConfetti: boolean;
  setEnableConfetti: (val: boolean) => void;

  // Modals state
  isNewTaskOpen: boolean;
  setIsNewTaskOpen: (val: boolean) => void;
  editingTask: TaskItem | null;
  setEditingTask: (task: TaskItem | null) => void;
  selectedDoc: CardDeckItem | null;
  setSelectedDoc: (doc: CardDeckItem | null) => void;
}

const initialTasks: TaskItem[] = [
  {
    id: 'WXB-2025-001',
    title: '需求评审会',
    priority: '高',
    status: '进行中',
    time: '今天 10:00',
    phase: '需求评审',
    assignee: {
      name: 'Brandon',
      avatar: 'BR',
      role: '产品经理'
    },
    project: 'WenXiBuddy 2.0',
    deadline: '2025-05-24 18:00',
    description: '与业务团队对齐需求范围，明确核心目标与验收标准，输出评审结论。',
    tags: ['评审', '需求', '关键路径'],
    aiSuggestions: [
      '建议关联相似历史评审文档 3 份',
      '检测到潜在风险：需求范围可能变更'
    ]
  },
  {
    id: 'WXB-2025-002',
    title: '用户调研分析',
    priority: '中',
    status: '进行中',
    time: '今天 14:00',
    phase: '需求评审',
    assignee: {
      name: 'Sarah',
      avatar: 'SR',
      role: 'UX研究员'
    },
    project: 'WenXiBuddy 2.0',
    deadline: '2025-05-25 12:00',
    description: '对30位核心企业客户进行产品使用反馈收集与痛点整理。',
    tags: ['调研', 'NPS', '体验'],
    aiSuggestions: [
      '推荐提取 Top 3 痛点转换为 Q3 里程碑 Task'
    ]
  },
  {
    id: 'WXB-2025-003',
    title: '竞品功能梳理',
    priority: '中',
    status: '待处理',
    time: '明天 09:30',
    phase: '需求评审',
    assignee: {
      name: 'Alex',
      avatar: 'AX',
      role: '产品助理'
    },
    project: 'WenXiBuddy 2.0',
    deadline: '2025-05-26 17:00',
    description: '对比行业Top 3同类产品的AI智能提效模块与交互差异。',
    tags: ['竞品', '功能对标']
  },
  {
    id: 'WXB-2025-004',
    title: '交互流程设计',
    priority: '高',
    status: '进行中',
    time: '进行中',
    phase: '产品设计',
    assignee: {
      name: 'Elena',
      avatar: 'EL',
      role: 'UI/UX设计师'
    },
    project: 'WenXiBuddy 2.0',
    deadline: '2025-06-05 18:00',
    description: '完成任务看板、3D CoverFlow卡片与AI智能建议面板的毛玻璃交互规范。',
    tags: ['UI', '交互', 'Figma'],
    aiSuggestions: [
      '建议补充 Dark Mode 高对比度无障碍可访问性说明'
    ]
  },
  {
    id: 'WXB-2025-005',
    title: '原型评审',
    priority: '中',
    status: '进行中',
    time: '进行中',
    phase: '产品设计',
    assignee: {
      name: 'Brandon',
      avatar: 'BR',
      role: '产品经理'
    },
    project: 'WenXiBuddy 2.0',
    deadline: '2025-05-28 16:00',
    description: '向核心干系人演示高保真原型并收集第二轮迭代意见。',
    tags: ['原型', '评审']
  },
  {
    id: 'WXB-2025-006',
    title: '核心功能开发',
    priority: '高',
    status: '待处理',
    time: '进行中',
    phase: '开发实现',
    assignee: {
      name: 'David',
      avatar: 'DV',
      role: '前端架构师'
    },
    project: 'WenXiBuddy 2.0',
    deadline: '2025-06-15 18:00',
    description: '完成React 19 + Tailwind CSS v4 + Framer Motion 3D Stack卡片交互实现。',
    tags: ['React', 'TypeScript', 'Tailwind']
  }
];

const initialFiles: FileDoc[] = [
  {
    id: 'doc-1',
    title: 'WenXiBuddy 2.0 需求规格说明书 (PRD)',
    category: '产品文档',
    size: '4.8 MB',
    author: 'Brandon',
    updatedAt: '2025-05-24 16:30',
    completion: 100,
    tags: ['PRD', '核心需求', '评审通过']
  },
  {
    id: 'doc-2',
    title: 'Glassmorphism Design System 3D 规范',
    category: '设计规范',
    size: '18.2 MB',
    author: 'Elena',
    updatedAt: '2025-05-23 11:20',
    completion: 95,
    tags: ['Figma', 'UI Kit', '毛玻璃']
  },
  {
    id: 'doc-3',
    title: 'GraphQL & WebSocket 实时协议设计',
    category: '技术文档',
    size: '2.4 MB',
    author: 'David',
    updatedAt: '2025-05-22 09:15',
    completion: 90,
    tags: ['API', 'WebSocket', '后端']
  },
];

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [tasks, setTasks] = useState<TaskItem[]>(initialTasks);
  const [selectedTask, setSelectedTask] = useState<TaskItem>(initialTasks[0]);
  const [files, setFiles] = useState<FileDoc[]>(initialFiles);
  const [workspaces, setWorkspaces] = useState([
    '产品研发中心',
    '设计协同空间',
    'AI 创新实验室',
    '市场运营中心'
  ]);
  const [currentWorkspace, setCurrentWorkspace] = useState('产品研发中心');

  // Themes
  const [accentColor, setAccentColor] = useState<'emerald' | 'cyan' | 'purple'>('emerald');
  const [glassBlur, setGlassBlur] = useState<'standard' | 'ultra' | 'max'>('ultra');
  const [enableConfetti, setEnableConfetti] = useState(true);

  // Modals
  const [isNewTaskOpen, setIsNewTaskOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<TaskItem | null>(null);
  const [selectedDoc, setSelectedDoc] = useState<CardDeckItem | null>(null);

  const addTask = (taskPartial: Partial<TaskItem>) => {
    const newTask: TaskItem = {
      id: taskPartial.id || `WXB-2025-${Math.floor(Math.random() * 900) + 100}`,
      title: taskPartial.title || '新建任务',
      priority: taskPartial.priority || '中',
      status: taskPartial.status || '进行中',
      time: taskPartial.time || '今天 12:00',
      phase: taskPartial.phase || '需求评审',
      assignee: taskPartial.assignee || { name: 'Brandon', avatar: 'BR', role: '产品经理' },
      project: taskPartial.project || currentWorkspace,
      deadline: taskPartial.deadline || '2025-05-30 18:00',
      description: taskPartial.description || '',
      tags: taskPartial.tags || ['新任务'],
      aiSuggestions: taskPartial.aiSuggestions || ['AI 助手建议关联匹配资源']
    };

    setTasks((prev) => [newTask, ...prev]);
    setSelectedTask(newTask);

    if (enableConfetti) {
      confetti({ particleCount: 50, spread: 60, origin: { y: 0.6 } });
    }
  };

  const updateTask = (taskId: string, updates: Partial<TaskItem>) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, ...updates } : t))
    );
    if (selectedTask.id === taskId) {
      setSelectedTask((prev) => ({ ...prev, ...updates }));
    }
  };

  const completeTask = (taskId: string) => {
    updateTask(taskId, { status: '已完成' });
    if (enableConfetti) {
      confetti({ particleCount: 70, spread: 70, origin: { x: 0.85, y: 0.6 } });
    }
  };

  const deleteTask = (taskId: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== taskId));
    if (selectedTask.id === taskId) {
      const remaining = tasks.filter((t) => t.id !== taskId);
      if (remaining.length > 0) setSelectedTask(remaining[0]);
    }
  };

  const addWorkspace = (name: string) => {
    if (!name.trim()) return;
    setWorkspaces((prev) => [...prev, name]);
    setCurrentWorkspace(name);
  };

  const addFile = (filePartial: Partial<FileDoc>) => {
    const newDoc: FileDoc = {
      id: `doc-${Date.now()}`,
      title: filePartial.title || '未命名文档',
      category: filePartial.category || '通用文档',
      size: filePartial.size || '1.2 MB',
      author: filePartial.author || 'Brandon',
      updatedAt: new Date().toISOString().slice(0, 16).replace('T', ' '),
      completion: 100,
      tags: filePartial.tags || ['新增']
    };
    setFiles((prev) => [newDoc, ...prev]);
  };

  return (
    <AppContext.Provider
      value={{
        tasks,
        selectedTask,
        setSelectedTask,
        addTask,
        updateTask,
        completeTask,
        deleteTask,
        currentWorkspace,
        setCurrentWorkspace,
        workspaces,
        addWorkspace,
        files,
        addFile,
        accentColor,
        setAccentColor,
        glassBlur,
        setGlassBlur,
        enableConfetti,
        setEnableConfetti,
        isNewTaskOpen,
        setIsNewTaskOpen,
        editingTask,
        setEditingTask,
        selectedDoc,
        setSelectedDoc,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within AppProvider');
  return context;
};
