import { createRouter, createRoute, createRootRoute, Outlet, redirect } from '@tanstack/react-router';
import { Sidebar } from '@/components/layout/Sidebar';
import { TopBar } from '@/components/layout/TopBar';
import { TaskManagementPage } from '@/pages/TaskManagementPage';
import { ProjectOverviewPage } from '@/pages/ProjectOverviewPage';
import { FileDocumentsPage } from '@/pages/FileDocumentsPage';
import { ScheduleManagementPage } from '@/pages/ScheduleManagementPage';
import { TeamCollaborationPage } from '@/pages/TeamCollaborationPage';
import { AIAnalyticsPage } from '@/pages/AIAnalyticsPage';
import { SettingsCenterPage } from '@/pages/SettingsCenterPage';
import { NewTaskModal } from '@/components/modals/NewTaskModal';
import { EditTaskModal } from '@/components/modals/EditTaskModal';
import { CreateDocModal } from '@/components/modals/CreateDocModal';
import { CreateScheduleModal } from '@/components/modals/CreateScheduleModal';
import { InviteMemberModal } from '@/components/modals/InviteMemberModal';
import { useUIStore } from '@/store/useUIStore';
import { useAddTask } from '@/lib/queries';
import { NavTab } from '@/types';
import React from 'react';

function RootLayout() {
  const isNewTaskOpen = useUIStore((s) => s.isNewTaskOpen);
  const setIsNewTaskOpen = useUIStore((s) => s.setIsNewTaskOpen);
  const isCreateDocOpen = useUIStore((s) => s.isCreateDocOpen);
  const setIsCreateDocOpen = useUIStore((s) => s.setIsCreateDocOpen);
  const isCreateScheduleOpen = useUIStore((s) => s.isCreateScheduleOpen);
  const setIsCreateScheduleOpen = useUIStore((s) => s.setIsCreateScheduleOpen);
  const isInviteMemberOpen = useUIStore((s) => s.isInviteMemberOpen);
  const setIsInviteMemberOpen = useUIStore((s) => s.setIsInviteMemberOpen);
  const addTaskMutation = useAddTask();

  return (
    <div className="w-full h-screen liquid-shell text-white overflow-hidden font-sans">
      <div className="app-frame relative z-10">
        <Sidebar />
        
        <div className="main-stack min-h-0">
          <Outlet />
        </div>
      </div>
      <NewTaskModal
        isOpen={isNewTaskOpen}
        onClose={() => setIsNewTaskOpen(false)}
        onAddTask={(task) => addTaskMutation.mutate(task)}
      />
      <CreateDocModal
        isOpen={isCreateDocOpen}
        onClose={() => setIsCreateDocOpen(false)}
      />
      <CreateScheduleModal
        isOpen={isCreateScheduleOpen}
        onClose={() => setIsCreateScheduleOpen(false)}
      />
      <InviteMemberModal
        isOpen={isInviteMemberOpen}
        onClose={() => setIsInviteMemberOpen(false)}
      />
      <EditTaskModal />
    </div>
  );
}

// Root Route contains the layout
export const rootRoute = createRootRoute({
  component: RootLayout,
});

// Helper for topbar layout
function withLayout(Component: React.ComponentType, tab: NavTab, title: string, subtitle: string) {
  return function LayoutWrapper() {
    return (
      <>
        <TopBar title={title} subtitle={subtitle} titleKey={tab} />
        <main className="flex-1 min-h-0 overflow-hidden relative">
          <Component />
        </main>
      </>
    );
  };
}

export const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  beforeLoad: () => {
    throw redirect({ to: '/tasks' });
  },
});

export const tasksRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/tasks',
  component: withLayout(TaskManagementPage, 'tasks', '任务管理', '高效规划 · 智能协同 · 结果驱动'),
});

export const overviewRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/overview',
  component: withLayout(ProjectOverviewPage, 'overview', '项目总览', '全景里程碑 · 研发健康度与进度跟进'),
});

export const filesRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/files',
  component: withLayout(FileDocumentsPage, 'files', '知识库', '归档沉淀 · 多维搜索与历史版本可溯'),
});

export const scheduleRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/schedule',
  component: withLayout(ScheduleManagementPage, 'schedule', '日程管理', '智能日历 · 会议排期与冲突预警'),
});

export const collaborationRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/collaboration',
  component: withLayout(TeamCollaborationPage, 'collaboration', '团队协作', '实时矩阵 · 成员负载与任务指派'),
});

export const analyticsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/analytics',
  component: withLayout(AIAnalyticsPage, 'analytics', '智能分析', 'AI 效能推演 · 链路瓶颈与风险评估'),
});

export const settingsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/settings',
  component: withLayout(SettingsCenterPage, 'settings', '设置中心', '自定义液态玻璃视觉与协同偏好'),
});

const routeTree = rootRoute.addChildren([
  indexRoute,
  tasksRoute,
  overviewRoute,
  filesRoute,
  scheduleRoute,
  collaborationRoute,
  analyticsRoute,
  settingsRoute,
]);

export const router = createRouter({ routeTree });

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}
