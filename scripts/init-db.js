import { createClient } from '@libsql/client';
import dotenv from 'dotenv';

// Load .env
dotenv.config();

const dbUrl = process.env.VITE_TURSO_DB_URL || 'file:local.db';
const authToken = process.env.VITE_TURSO_DB_AUTH_TOKEN || '';

const client = createClient({
  url: dbUrl,
  authToken: authToken,
});

async function main() {
  console.log(`[init-db] Connecting to Database at: ${dbUrl}`);
  
  // 1. Create Workspaces Table
  await client.execute(`
    CREATE TABLE IF NOT EXISTS workspaces (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL UNIQUE
    )
  `);

  // 2. Create Tasks Table
  await client.execute(`
    CREATE TABLE IF NOT EXISTS tasks (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      priority TEXT NOT NULL,
      status TEXT NOT NULL,
      created_at INTEGER NOT NULL,
      phase TEXT NOT NULL,
      assignee_name TEXT NOT NULL,
      assignee_avatar TEXT NOT NULL,
      assignee_role TEXT NOT NULL,
      project TEXT NOT NULL,
      deadline INTEGER NOT NULL,
      description TEXT NOT NULL,
      tags TEXT NOT NULL,
      ai_suggestions TEXT,
      completion_progress INTEGER
    )
  `);

  // 3. Create Files Table
  await client.execute(`
    CREATE TABLE IF NOT EXISTS files (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      category TEXT NOT NULL,
      size TEXT NOT NULL,
      author TEXT NOT NULL,
      updated_at INTEGER NOT NULL,
      completion INTEGER,
      tags TEXT NOT NULL
    )
  `);

  // 4. Create Schedule Events Table
  await client.execute(`
    CREATE TABLE IF NOT EXISTS schedule_events (
      id INTEGER PRIMARY KEY,
      title TEXT NOT NULL,
      start_time INTEGER NOT NULL,
      end_time INTEGER NOT NULL,
      room TEXT NOT NULL,
      priority TEXT NOT NULL,
      attendees TEXT NOT NULL,
      status TEXT NOT NULL
    )
  `);

  console.log('[init-db] Tables created successfully.');

  // Clear existing data (for idempotency)
  await client.execute('DELETE FROM workspaces');
  await client.execute('DELETE FROM tasks');
  await client.execute('DELETE FROM files');
  await client.execute('DELETE FROM schedule_events');

  // Insert Workspaces
  const workspaces = ['产品研发中心', '设计协同空间', 'AI 创新实验室', '市场运营中心'];
  for (const ws of workspaces) {
    await client.execute({
      sql: 'INSERT INTO workspaces (id, name) VALUES (?, ?)',
      args: [`ws-${Date.now()}-${Math.random().toString(36).substring(7)}`, ws],
    });
  }

  // Insert Tasks
  const today = new Date();
  const getTodayTime = (hours, minutes=0) => new Date(today.getFullYear(), today.getMonth(), today.getDate(), hours, minutes).getTime();
  const getTomorrowTime = (hours, minutes=0) => new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1, hours, minutes).getTime();

  const initialTasks = [
    {
      id: 'WXB-2025-001',
      title: '需求评审会',
      priority: '高',
      status: '进行中',
      createdAt: getTodayTime(10, 0),
      phase: '需求评审',
      assignee: { name: 'Brandon', avatar: 'BR', role: '产品经理' },
      project: 'WenXiBuddy 2.0',
      deadline: new Date(2025, 4, 24, 18, 0).getTime(),
      description: '与业务团队对齐需求范围，明确核心目标与验收标准，输出评审结论。',
      tags: ['评审', '需求', '关键路径'],
      aiSuggestions: ['建议关联相似历史评审文档 3 份', '检测到潜在风险：需求范围可能变更']
    },
    {
      id: 'WXB-2025-002',
      title: '用户调研分析',
      priority: '中',
      status: '进行中',
      createdAt: getTodayTime(14, 0),
      phase: '需求评审',
      assignee: { name: 'Sarah', avatar: 'SR', role: 'UX研究员' },
      project: 'WenXiBuddy 2.0',
      deadline: new Date(2025, 4, 25, 12, 0).getTime(),
      description: '对30位核心企业客户进行产品使用反馈收集与痛点整理。',
      tags: ['调研', 'NPS', '体验'],
      aiSuggestions: ['推荐提取 Top 3 痛点转换为 Q3 里程碑 Task']
    },
    {
      id: 'WXB-2025-003',
      title: '竞品功能梳理',
      priority: '中',
      status: '待处理',
      createdAt: getTomorrowTime(9, 30),
      phase: '需求评审',
      assignee: { name: 'Alex', avatar: 'AX', role: '产品助理' },
      project: 'WenXiBuddy 2.0',
      deadline: new Date(2025, 4, 26, 17, 0).getTime(),
      description: '对比行业Top 3同类产品的AI智能提效模块与交互差异。',
      tags: ['竞品', '功能对标'],
      aiSuggestions: []
    },
    {
      id: 'WXB-2025-004',
      title: '交互流程设计',
      priority: '高',
      status: '进行中',
      createdAt: getTodayTime(9, 0),
      phase: '产品设计',
      assignee: { name: 'Elena', avatar: 'EL', role: 'UI/UX设计师' },
      project: 'WenXiBuddy 2.0',
      deadline: new Date(2025, 5, 5, 18, 0).getTime(),
      description: '完成任务看板、3D CoverFlow卡片与AI智能建议面板的毛玻璃交互规范。',
      tags: ['UI', '交互', 'Figma'],
      aiSuggestions: ['建议补充 Dark Mode 高对比度无障碍可访问性说明']
    },
    {
      id: 'WXB-2025-005',
      title: '原型评审',
      priority: '中',
      status: '进行中',
      createdAt: getTodayTime(11, 0),
      phase: '产品设计',
      assignee: { name: 'Brandon', avatar: 'BR', role: '产品经理' },
      project: 'WenXiBuddy 2.0',
      deadline: new Date(new Date().getFullYear(), new Date().getMonth(), 28, 16, 0).getTime(),
      description: '向核心干系人演示高保真原型并收集第二轮迭代意见。',
      tags: ['原型', '评审'],
      aiSuggestions: []
    },
    {
      id: 'WXB-2025-006',
      title: '核心功能开发',
      priority: '高',
      status: '待处理',
      createdAt: getTodayTime(15, 0),
      phase: '开发实现',
      assignee: { name: 'David', avatar: 'DV', role: '前端架构师' },
      project: 'WenXiBuddy 2.0',
      deadline: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 15, 18, 0).getTime(),
      description: '完成React 19 + Tailwind CSS v4 + Framer Motion 3D Stack卡片交互实现。',
      tags: ['React', 'TypeScript', 'Tailwind'],
      aiSuggestions: []
    }
  ];

  for (const t of initialTasks) {
    await client.execute({
      sql: `INSERT INTO tasks (
        id, title, priority, status, created_at, phase, assignee_name, assignee_avatar, assignee_role,
        project, deadline, description, tags, ai_suggestions, completion_progress
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [
        t.id, t.title, t.priority, t.status, t.createdAt, t.phase,
        t.assignee.name, t.assignee.avatar, t.assignee.role,
        t.project, t.deadline, t.description,
        JSON.stringify(t.tags), JSON.stringify(t.aiSuggestions || []), t.completionProgress || 0
      ]
    });
  }

  // Insert Files
  const initialFiles = [
    { id: 'doc-1', title: 'WenXiBuddy 2.0 需求规格说明书 (PRD)', category: '产品文档', size: '4.8 MB', author: 'Brandon', updatedAt: new Date(new Date().getFullYear(), new Date().getMonth(), 24, 16, 30).getTime(), completion: 100, tags: ['PRD', '核心需求', '评审通过'] },
    { id: 'doc-2', title: 'Glassmorphism Design System 3D 规范', category: '设计规范', size: '18.2 MB', author: 'Elena', updatedAt: new Date(new Date().getFullYear(), new Date().getMonth(), 23, 11, 20).getTime(), completion: 95, tags: ['Figma', 'UI Kit', '毛玻璃'] },
    { id: 'doc-3', title: 'GraphQL & WebSocket 实时协议设计', category: '技术文档', size: '2.4 MB', author: 'David', updatedAt: new Date(new Date().getFullYear(), new Date().getMonth(), 22, 9, 15).getTime(), completion: 90, tags: ['API', 'WebSocket', '后端'] },
  ];

  for (const f of initialFiles) {
    await client.execute({
      sql: 'INSERT INTO files (id, title, category, size, author, updated_at, completion, tags) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      args: [f.id, f.title, f.category, f.size, f.author, f.updatedAt, f.completion || 0, JSON.stringify(f.tags)]
    });
  }

  // Insert Schedule Events
  const getEventTime = (day, hourDecimal) => {
    const hours = Math.floor(hourDecimal);
    const minutes = (hourDecimal % 1) * 60;
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), day, hours, minutes).getTime();
  };

  const initialEvents = [
    { id: 1, title: 'WXB-2025-001 需求评审会', room: '线上会议室 Alpha', priority: '高', attendees: ['Brandon', 'Elena'], status: '进行中', startTime: getEventTime(24, 10), endTime: getEventTime(24, 11.5) },
    { id: 2, title: 'Q2 架构设计演进讨论', room: '302 脑暴研讨室', priority: '中', attendees: ['David', 'Alex'], status: '待开始', startTime: getEventTime(24, 14), endTime: getEventTime(24, 15.5) },
    { id: 3, title: '前端 3D CoverFlow 走查', room: '线上演示', priority: '高', attendees: ['David', 'Brandon'], status: '待开始', startTime: getEventTime(24, 16.5), endTime: getEventTime(24, 17.5) },
    { id: 4, title: '原型评审', room: '设计中心', priority: '中', attendees: ['Elena', 'Sarah'], status: '待开始', startTime: getEventTime(28, 15), endTime: getEventTime(28, 16) },
    { id: 5, title: 'Sprint 计划会', room: '会议室 B', priority: '高', attendees: ['Team'], status: '已结束', startTime: getEventTime(20, 9.5), endTime: getEventTime(20, 10.5) },
    { id: 6, title: 'API 联调同步', room: '线上', priority: '中', attendees: ['David', 'Michael'], status: '已结束', startTime: getEventTime(22, 11), endTime: getEventTime(22, 12) },
    { id: 7, title: '用户访谈复盘', room: 'UX Lab', priority: '低', attendees: ['Sarah'], status: '已结束', startTime: getEventTime(21, 14), endTime: getEventTime(21, 15) },
  ];

  for (const e of initialEvents) {
    await client.execute({
      sql: 'INSERT INTO schedule_events (id, title, start_time, end_time, room, priority, attendees, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      args: [e.id, e.title, e.startTime, e.endTime, e.room, e.priority, JSON.stringify(e.attendees), e.status]
    });
  }

  console.log('[init-db] Initial data synchronized successfully!');
}

main().catch((err) => {
  console.error('[init-db] Failed to initialize database:', err);
  process.exit(1);
});
