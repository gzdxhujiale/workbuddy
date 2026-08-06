import { createClient } from '@libsql/client';
import dotenv from 'dotenv';

// Load .env
dotenv.config();

const rawUrl = process.env.TURSO_DB_URL || process.env.VITE_TURSO_DB_URL || 'file:local.db';
const dbUrl = rawUrl.replace(/^turso:\/\//, 'libsql://');
const authToken = process.env.TURSO_DB_AUTH_TOKEN || process.env.VITE_TURSO_DB_AUTH_TOKEN || '';

const client = createClient({
  url: dbUrl,
  authToken: authToken,
});

async function main() {
  console.log(`[init-db] Connecting to Database at: ${dbUrl}`);
  
  console.log('[init-db] Synchronizing seed data to existing tables...');

  // Clear existing data (for idempotency)
  await client.execute('DELETE FROM workspaces');
  await client.execute('DELETE FROM tasks');
  await client.execute('DELETE FROM schedule_events');

  // Re-create tables with updated schema
  await client.execute(`
    CREATE TABLE IF NOT EXISTS knowledge_categories (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      sort_order INTEGER NOT NULL DEFAULT 0,
      updated_at INTEGER NOT NULL,
      deleted_at INTEGER DEFAULT NULL
    );
  `);
  await client.execute('DELETE FROM knowledge_categories');

  try {
    await client.execute('ALTER TABLE knowledge_bases ADD COLUMN category_id TEXT DEFAULT NULL');
  } catch (e) {
    // Column may already exist
  }
  await client.execute('DELETE FROM knowledge_bases');

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

  // Insert Knowledge Categories
  const initialCategories = [
    { id: 'cat-1', name: '产品文档', sort_order: 10, updated_at: Date.now() },
    { id: 'cat-2', name: '设计规范', sort_order: 20, updated_at: Date.now() },
    { id: 'cat-3', name: '技术文档', sort_order: 30, updated_at: Date.now() },
    { id: 'cat-4', name: '测试文档', sort_order: 40, updated_at: Date.now() },
    { id: 'cat-5', name: '通用文档', sort_order: 50, updated_at: Date.now() },
  ];

  for (const cat of initialCategories) {
    await client.execute({
      sql: 'INSERT INTO knowledge_categories (id, name, sort_order, updated_at, deleted_at) VALUES (?, ?, ?, ?, NULL)',
      args: [cat.id, cat.name, cat.sort_order, cat.updated_at],
    });
  }

  // Insert Knowledge Bases (JSON AST Storage Format)
  const initialKnowledgeBases = [
    {
      id: 'kb-1',
      title: 'WenXiBuddy 2.0 需求规格说明书 (PRD)',
      sort_order: 10,
      category_id: 'cat-1',
      content: JSON.stringify({
        type: 'doc',
        content: [
          { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: '1. 产品概述' }] },
          { type: 'paragraph', content: [{ type: 'text', text: 'WenXiBuddy 2.0 是面向高效团队研发管理的 AI 驱动工作流与协同平台。' }] },
          { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: '2. 核心功能点' }] },
          {
            type: 'taskList',
            content: [
              { type: 'taskItem', attrs: { checked: true }, content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Tiptap JSON 结构化块级编辑器集成' }] }] },
              { type: 'taskItem', attrs: { checked: true }, content: [{ type: 'paragraph', content: [{ type: 'text', text: '3D 任务看板与 CoverFlow 卡片' }] }] },
              { type: 'taskItem', attrs: { checked: false }, content: [{ type: 'paragraph', content: [{ type: 'text', text: '实时数据流防抖写入与软删除' }] }] },
            ]
          }
        ]
      }),
      updated_at: new Date(new Date().getFullYear(), new Date().getMonth(), 24, 16, 30).getTime(),
      deleted_at: null
    },
    {
      id: 'kb-2',
      title: 'Glassmorphism Design System 3D 规范',
      sort_order: 20,
      category_id: 'cat-2',
      content: JSON.stringify({
        type: 'doc',
        content: [
          { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: '设计语言定义' }] },
          { type: 'paragraph', content: [{ type: 'text', text: '采用深色现代基调（Modern Dark Theme）辅以多层毛玻璃与流体微动画。' }] },
          { type: 'blockquote', content: [{ type: 'paragraph', content: [{ type: 'text', text: '视觉核心原则：无缝融合、极致透光、极简块级操控、流畅动效。' }] }] }
        ]
      }),
      updated_at: new Date(new Date().getFullYear(), new Date().getMonth(), 23, 11, 20).getTime(),
      deleted_at: null
    },
    {
      id: 'kb-3',
      title: 'GraphQL & WebSocket 实时协议设计',
      sort_order: 30,
      category_id: 'cat-3',
      content: JSON.stringify({
        type: 'doc',
        content: [
          { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: '实时推送与长连接规范' }] },
          { type: 'paragraph', content: [{ type: 'text', text: '前后端建立 WebSocket 双向通道，结合 Turso LibSQL 异步事件驱动。' }] },
          { type: 'codeBlock', content: [{ type: 'text', text: '// 状态推送通道定义\nconst channel = new BroadcastChannel("wxb_realtime");' }] }
        ]
      }),
      updated_at: new Date(new Date().getFullYear(), new Date().getMonth(), 22, 9, 15).getTime(),
      deleted_at: null
    },
    {
      id: 'kb-4',
      title: '未分类草案与协同想法',
      sort_order: 40,
      category_id: null,
      content: JSON.stringify({
        type: 'doc',
        content: [
          { type: 'paragraph', content: [{ type: 'text', text: '此篇文档默认属于全部分类（category 为 null）。可以在此处记录未归档的团队灵感。' }] }
        ]
      }),
      updated_at: new Date(new Date().getFullYear(), new Date().getMonth(), 25, 10, 0).getTime(),
      deleted_at: null
    }
  ];

  for (const kb of initialKnowledgeBases) {
    await client.execute({
      sql: 'INSERT INTO knowledge_bases (id, title, sort_order, category_id, content, updated_at, deleted_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
      args: [kb.id, kb.title, kb.sort_order, kb.category_id, kb.content, kb.updated_at, kb.deleted_at]
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

  // Create & Seed Time Tasks Table
  await client.execute(`
    CREATE TABLE IF NOT EXISTS time_tasks (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      priority TEXT NOT NULL DEFAULT '中',
      status TEXT NOT NULL DEFAULT '进行中',
      description TEXT DEFAULT '',
      deadline INTEGER NOT NULL,
      remind_at INTEGER,
      completed_at INTEGER
    );
  `);
  await client.execute('DELETE FROM time_tasks');

  const nowTime = Date.now();
  const initialTimeTasks = [
    {
      id: 'TM-2025-001',
      title: '完成 Q3 架构演进方案设计',
      priority: '高',
      status: '进行中',
      description: '梳理高并发微服务架构，整理模块解耦与数据持久化方案。',
      deadline: nowTime + 3600000 * 4,
      remindAt: nowTime + 3600000 * 2,
      completedAt: null,
    },
    {
      id: 'TM-2025-002',
      title: '前端 Glassmorphism 样式走查',
      priority: '中',
      status: '已完成',
      description: '确认毛玻璃无缝结合、动效防抖与暗黑模式可访问性对比度。',
      deadline: nowTime - 3600000 * 5,
      remindAt: nowTime - 3600000 * 6,
      completedAt: nowTime - 3600000 * 2,
    },
    {
      id: 'TM-2025-003',
      title: '团队每周时间分配复盘',
      priority: '低',
      status: '进行中',
      description: '汇总研发团队工时分布，产出下一 Sprint 资源排期表。',
      deadline: nowTime + 86400000 * 2,
      remindAt: nowTime + 86400000 * 2 - 3600000 * 2,
      completedAt: null,
    },
  ];

  for (const t of initialTimeTasks) {
    await client.execute({
      sql: `INSERT INTO time_tasks (id, title, priority, status, description, deadline, remind_at, completed_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [t.id, t.title, t.priority, t.status, t.description, t.deadline, t.remindAt, t.completedAt],
    });
  }

  console.log('[init-db] Initial data synchronized successfully!');
}

main().catch((err) => {
  console.error('[init-db] Failed to initialize database:', err);
  process.exit(1);
});
